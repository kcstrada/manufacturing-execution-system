#!/bin/bash

# Fix superadmin user role in Keycloak

set -e

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

echo -e "${YELLOW}🔐 Fixing superadmin user role in Keycloak...${NC}"

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

# Get the superadmin user
echo "Finding superadmin user..."
USER_DATA=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=superadmin")

USER_ID=$(echo "$USER_DATA" | jq -r '.[0].id')

if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
    echo -e "${YELLOW}⚠️  User 'superadmin' not found, trying to find by email...${NC}"

    USER_DATA=$(curl -s -X GET \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?email=superadmin@mes.local")

    USER_ID=$(echo "$USER_DATA" | jq -r '.[0].id')
fi

if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ User 'superadmin' not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found superadmin user: $USER_ID${NC}"

# Get current roles
echo "Checking current roles..."
CURRENT_ROLES=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm")

echo "Current realm roles:"
echo "$CURRENT_ROLES" | jq -r '.[].name' | sed 's/^/  - /'

# Get the super_admin role
echo "Getting super_admin role..."
ROLE_DATA=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/super_admin")

ROLE_ID=$(echo "$ROLE_DATA" | jq -r '.id')

if [ "$ROLE_ID" == "null" ] || [ -z "$ROLE_ID" ]; then
    echo -e "${RED}❌ Role 'super_admin' not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found super_admin role: $ROLE_ID${NC}"

# Assign super_admin role to user
echo "Assigning super_admin role..."
curl -s -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm" \
    -d "[{\"id\":\"${ROLE_ID}\",\"name\":\"super_admin\"}]"

echo -e "${GREEN}✅ Assigned super_admin role${NC}"

# Verify final roles
echo "Verifying final roles..."
FINAL_ROLES=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm")

echo "Final realm roles:"
echo "$FINAL_ROLES" | jq -r '.[].name' | sed 's/^/  - /'

# Check if super_admin is in the list
HAS_SUPER_ADMIN=$(echo "$FINAL_ROLES" | jq -r '.[].name' | grep -c "super_admin" || true)

if [ "$HAS_SUPER_ADMIN" -gt 0 ]; then
    echo -e "${GREEN}🎉 Successfully verified: superadmin user has super_admin role!${NC}"
else
    echo -e "${RED}❌ Warning: super_admin role not found in user's roles${NC}"
fi

echo ""
echo "Please logout and login again as superadmin@mes.local for the changes to take effect."