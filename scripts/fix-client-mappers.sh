#!/bin/bash

# Fix client role mappers in Keycloak to ensure roles are in the token

set -e

# Configuration
KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM_NAME="mes"
CLIENT_ID="admin-portal"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Fixing client mappers for role inclusion in token...${NC}"

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

# Get the client
echo "Finding client: $CLIENT_ID..."
CLIENT_DATA=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}")

CLIENT_UUID=$(echo "$CLIENT_DATA" | jq -r '.[0].id')

if [ "$CLIENT_UUID" == "null" ] || [ -z "$CLIENT_UUID" ]; then
    echo -e "${RED}❌ Client '$CLIENT_ID' not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found client: $CLIENT_UUID${NC}"

# Create realm roles mapper
echo "Creating/updating realm roles mapper..."
REALM_ROLES_MAPPER='{
  "name": "realm roles",
  "protocol": "openid-connect",
  "protocolMapper": "oidc-usermodel-realm-role-mapper",
  "consentRequired": false,
  "config": {
    "multivalued": "true",
    "userinfo.token.claim": "true",
    "id.token.claim": "true",
    "access.token.claim": "true",
    "claim.name": "realm_access.roles",
    "jsonType.label": "String"
  }
}'

curl -s -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/protocol-mappers/models" \
    -d "$REALM_ROLES_MAPPER" || echo "Realm roles mapper might already exist"

echo -e "${GREEN}✅ Realm roles mapper configured${NC}"

# Create client roles mapper
echo "Creating/updating client roles mapper..."
CLIENT_ROLES_MAPPER='{
  "name": "client roles",
  "protocol": "openid-connect",
  "protocolMapper": "oidc-usermodel-client-role-mapper",
  "consentRequired": false,
  "config": {
    "multivalued": "true",
    "userinfo.token.claim": "true",
    "id.token.claim": "true",
    "access.token.claim": "true",
    "claim.name": "resource_access.${client_id}.roles",
    "jsonType.label": "String"
  }
}'

curl -s -X POST \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/protocol-mappers/models" \
    -d "$CLIENT_ROLES_MAPPER" || echo "Client roles mapper might already exist"

echo -e "${GREEN}✅ Client roles mapper configured${NC}"

# Update client settings to include roles in token
echo "Updating client settings..."
CLIENT_UPDATE='{
  "fullScopeAllowed": true,
  "directAccessGrantsEnabled": true,
  "implicitFlowEnabled": false,
  "standardFlowEnabled": true
}'

curl -s -X PUT \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}" \
    -d "$CLIENT_UPDATE"

echo -e "${GREEN}✅ Client settings updated${NC}"

# Get current mappers
echo "Current protocol mappers:"
MAPPERS=$(curl -s -X GET \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/protocol-mappers/models")

echo "$MAPPERS" | jq -r '.[].name' | sed 's/^/  - /'

echo -e "${GREEN}🎉 Client mapper configuration complete!${NC}"
echo ""
echo "The admin-portal client is now configured to include roles in the token."
echo "Please logout and login again for the changes to take effect."