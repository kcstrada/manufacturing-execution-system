#!/bin/bash

# Keycloak configuration
KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

echo "🔐 Setting up Keycloak MES realm..."

# Get admin token
echo "Getting admin token..."
TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get admin token. Make sure Keycloak is running and credentials are correct."
  exit 1
fi

echo "✅ Got admin token"

# Create MES realm
echo "Creating MES realm..."
REALM_RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "MES",
    "displayName": "Manufacturing Execution System",
    "enabled": true,
    "registrationAllowed": false,
    "loginWithEmailAllowed": true,
    "duplicateEmailsAllowed": false,
    "resetPasswordAllowed": true,
    "editUsernameAllowed": false,
    "bruteForceProtected": true,
    "permanentLockout": false,
    "maxFailureWaitSeconds": 900,
    "minimumQuickLoginWaitSeconds": 60,
    "waitIncrementSeconds": 60,
    "quickLoginCheckMilliSeconds": 1000,
    "maxDeltaTimeSeconds": 43200,
    "failureFactor": 30,
    "sslRequired": "external",
    "eventsEnabled": true,
    "eventsExpiration": 7776000,
    "adminEventsEnabled": true,
    "adminEventsDetailsEnabled": true,
    "attributes": {
      "frontendUrl": "http://localhost:8080"
    }
  }')

if echo "$REALM_RESPONSE" | grep -q "error"; then
  if echo "$REALM_RESPONSE" | grep -q "Realm with same name exists"; then
    echo "⚠️  MES realm already exists"
  else
    echo "❌ Failed to create realm: $REALM_RESPONSE"
    exit 1
  fi
else
  echo "✅ MES realm created successfully"
fi

# Create realm roles
echo "Creating realm roles..."

ROLES=(
  "admin"
  "production_manager"
  "quality_inspector"
  "maintenance_technician"
  "operator"
  "viewer"
)

for ROLE in "${ROLES[@]}"; do
  ROLE_RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/admin/realms/MES/roles" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${ROLE}\",
      \"description\": \"${ROLE} role for Manufacturing Execution System\"
    }")

  if echo "$ROLE_RESPONSE" | grep -q "error"; then
    if echo "$ROLE_RESPONSE" | grep -q "Role with name ${ROLE} already exists"; then
      echo "  ⚠️  Role ${ROLE} already exists"
    else
      echo "  ⚠️  Could not create role ${ROLE}"
    fi
  else
    echo "  ✅ Role ${ROLE} created"
  fi
done

echo ""
echo "🎉 MES realm setup completed!"
echo ""
echo "Now run the client setup script:"
echo "  ./scripts/keycloak-add-admin-portal.sh"