#!/bin/bash

# Fix admin user roles in Keycloak

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

echo -e "${YELLOW}🔐 Fixing admin roles in Keycloak...${NC}"

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

# Get the admin user
echo "Finding admin user..."
USER_DATA=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=admin")

USER_ID=$(echo "$USER_DATA" | jq -r '.[0].id')

if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ User 'admin' not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found admin user: $USER_ID${NC}"

# Get current roles
echo "Checking current roles..."
CURRENT_ROLES=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm")

echo "Current realm roles:"
echo "$CURRENT_ROLES" | jq -r '.[].name' | sed 's/^/  - /'

# Assign admin and super_admin roles
ROLES_TO_ASSIGN=("admin" "super_admin")

for ROLE_NAME in "${ROLES_TO_ASSIGN[@]}"; do
    echo "Assigning role: $ROLE_NAME"

    # Get role details
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
            -d "[{\"id\":\"${ROLE_ID}\",\"name\":\"${ROLE_NAME}\"}]"
        echo -e "${GREEN}✅ Assigned role: $ROLE_NAME${NC}"
    else
        echo -e "${YELLOW}⚠️  Role '$ROLE_NAME' not found or already assigned${NC}"
    fi
done

# Verify final roles
echo "Verifying final roles..."
FINAL_ROLES=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/role-mappings/realm")

echo "Final realm roles:"
echo "$FINAL_ROLES" | jq -r '.[].name' | sed 's/^/  - /'

echo -e "${GREEN}🎉 Role assignment complete!${NC}"
echo ""
echo "The admin user now has the following roles assigned."
echo "Please logout and login again for the changes to take effect."