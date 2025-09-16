#!/bin/bash

# Keycloak Setup Script for Manufacturing Execution System
# This script creates the MES realm, clients, and roles in Keycloak

set -e

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Please install jq first."
    echo "On macOS: brew install jq"
    echo "On Ubuntu/Debian: apt-get install jq"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "curl is required but not installed."
    exit 1
fi

# Configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM_NAME="mes"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Setting up Keycloak for Manufacturing Execution System...${NC}"

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
until curl -s -f -o /dev/null "${KEYCLOAK_URL}/health/ready"; do
    echo "Keycloak is not ready yet. Waiting..."
    sleep 5
done
echo -e "${GREEN}✅ Keycloak is ready!${NC}"

# Get admin token
echo "Getting admin access token..."
ACCESS_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get admin access token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Got admin access token${NC}"

# Check if realm already exists
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}")

if [ "$REALM_EXISTS" == "200" ]; then
    echo -e "${YELLOW}⚠️  Realm '${REALM_NAME}' already exists. Skipping realm creation...${NC}"
else
    # Create realm
    echo "Creating realm '${REALM_NAME}'..."
    
    # Process the realm configuration to replace variables
    REALM_CONFIG=$(cat scripts/keycloak-realm.json | \
        sed "s|\${KEYCLOAK_FRONTEND_URL}|${KEYCLOAK_FRONTEND_URL:-http://localhost:8080}|g")
    
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_URL}/admin/realms" \
        -d "$REALM_CONFIG" \
        -w "\n%{http_code}" | tail -n 1)
    
    if [ "$RESPONSE" == "201" ]; then
        echo -e "${GREEN}✅ Realm '${REALM_NAME}' created${NC}"
    else
        echo -e "${RED}❌ Failed to create realm. Response code: $RESPONSE${NC}"
        echo "Trying to continue anyway..."
    fi
fi

# Import clients configuration
echo "Importing clients configuration..."
# Read the clients array and create each client individually
CLIENTS=$(cat scripts/keycloak-clients.json | jq -c '.[]')
while IFS= read -r CLIENT; do
    CLIENT_ID=$(echo "$CLIENT" | jq -r '.clientId')
    echo "Creating client: $CLIENT_ID"
    
    # Replace environment variables in the client configuration
    PROCESSED_CLIENT=$(echo "$CLIENT" | \
        sed "s|\${BACKEND_URL}|${BACKEND_URL:-http://localhost:3000}|g" | \
        sed "s|\${BACKEND_CLIENT_SECRET}|${BACKEND_CLIENT_SECRET:-backend-secret}|g" | \
        sed "s|\${ADMIN_PORTAL_URL}|${ADMIN_PORTAL_URL:-http://localhost:3001}|g" | \
        sed "s|\${USER_PORTAL_URL}|${USER_PORTAL_URL:-http://localhost:3002}|g")
    
    curl -s -X POST \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
        -d "$PROCESSED_CLIENT" || echo "Client $CLIENT_ID might already exist"
done <<< "$CLIENTS"

echo -e "${GREEN}✅ Clients configured${NC}"

# Create roles
echo "Creating roles..."
ROLES=("super_admin" "admin" "executive" "sales" "worker")

for ROLE in "${ROLES[@]}"; do
    # Create description with capitalized first letter
    DESCRIPTION="${ROLE} role for MES system"
    curl -s -X POST \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
        -d "{\"name\": \"${ROLE}\", \"description\": \"${DESCRIPTION}\"}" || true
done

echo -e "${GREEN}✅ Roles created${NC}"

# Create default users
echo "Creating default users..."
# Read the users array and create each user individually
USERS=$(cat scripts/keycloak-users.json | jq -c '.[]')
while IFS= read -r USER; do
    USERNAME=$(echo "$USER" | jq -r '.username')
    echo "Creating user: $USERNAME"
    
    # Create the user
    USER_ID=$(curl -s -X POST \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
        -d "$USER" \
        -w "\n%{http_code}" | tail -n 1)
    
    if [ "$USER_ID" == "201" ] || [ "$USER_ID" == "409" ]; then
        echo "User $USERNAME created or already exists"
        
        # Get user ID to assign roles
        USER_DATA=$(curl -s -X GET \
            -H "Authorization: Bearer ${ACCESS_TOKEN}" \
            "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=${USERNAME}")
        
        USER_ID=$(echo "$USER_DATA" | jq -r '.[0].id')
        
        if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
            # Get roles from user data
            ROLE_NAMES=$(echo "$USER" | jq -r '.realmRoles[]' | grep -v "default-roles-mes" || true)
            
            # Assign roles to user
            while IFS= read -r ROLE_NAME; do
                if [ -n "$ROLE_NAME" ]; then
                    # Get role ID
                    ROLE_DATA=$(curl -s -X GET \
                        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/${ROLE_NAME}")
                    
                    ROLE_ID=$(echo "$ROLE_DATA" | jq -r '.id')
                    
                    if [ "$ROLE_ID" != "null" ] && [ -n "$ROLE_ID" ]; then
                        # Assign role to user
                        curl -s -X POST \
                            -H "Authorization: Bearer ${ACCESS_TOKEN}" \
                            -H "Content-Type: application/json" \
                            "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm" \
                            -d "[{\"id\":\"${ROLE_ID}\",\"name\":\"${ROLE_NAME}\"}]" || true
                    fi
                fi
            done <<< "$ROLE_NAMES"
        fi
    fi
done <<< "$USERS"

echo -e "${GREEN}✅ Default users created${NC}"

echo -e "${GREEN}🎉 Keycloak setup complete!${NC}"
echo ""
echo "Default users created:"
echo "  Super Admin: superadmin@mes.local / SuperAdmin@2024"
echo "  Admin:       admin@mes.local / admin123 (has super_admin role)"
echo "  Executive:   executive@mes.local / executive123"
echo "  Sales:       sales@mes.local / sales123"
echo "  Worker:      worker@mes.local / worker123"