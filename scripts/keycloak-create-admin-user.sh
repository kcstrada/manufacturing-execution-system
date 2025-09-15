#!/bin/bash

# Keycloak configuration
KEYCLOAK_URL="http://localhost:8080"
REALM="MES"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

# Test user configuration
TEST_USER="admin@mes.local"
TEST_PASSWORD="admin123"
TEST_FIRSTNAME="Admin"
TEST_LASTNAME="User"

echo "🔐 Creating admin user in Keycloak MES realm..."

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

# Create user
echo "Creating user ${TEST_USER}..."
USER_ID=$(curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${TEST_USER}\",
    \"email\": \"${TEST_USER}\",
    \"firstName\": \"${TEST_FIRSTNAME}\",
    \"lastName\": \"${TEST_LASTNAME}\",
    \"enabled\": true,
    \"emailVerified\": true,
    \"attributes\": {
      \"department\": [\"Production\"],
      \"employeeId\": [\"EMP001\"]
    }
  }" -w "\n%{http_code}" | tail -n 1)

if [ "$USER_ID" == "409" ]; then
  echo "⚠️  User ${TEST_USER} already exists, fetching user ID..."
  USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${TEST_USER}" \
    -H "Authorization: Bearer ${TOKEN}" | jq -r '.[0].id')
  echo "Found existing user with ID: ${USER_ID}"
elif [ "$USER_ID" == "201" ]; then
  echo "✅ User created successfully, fetching user ID..."
  USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${TEST_USER}" \
    -H "Authorization: Bearer ${TOKEN}" | jq -r '.[0].id')
else
  echo "❌ Failed to create user. HTTP status: ${USER_ID}"
  exit 1
fi

# Set password
echo "Setting password for user..."
curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_ID}/reset-password" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"password\",
    \"value\": \"${TEST_PASSWORD}\",
    \"temporary\": false
  }"
echo "✅ Password set"

# Get admin role ID
echo "Getting admin role ID..."
ROLE_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/admin" \
  -H "Authorization: Bearer ${TOKEN}" | jq -r '.id')

if [ "$ROLE_ID" == "null" ] || [ -z "$ROLE_ID" ]; then
  echo "❌ Admin role not found. Make sure the realm setup script has been run."
  exit 1
fi

# Assign admin role to user
echo "Assigning admin role to user..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_ID}/role-mappings/realm" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "[{
    \"id\": \"${ROLE_ID}\",
    \"name\": \"admin\"
  }]"
echo "✅ Admin role assigned"

# Also assign other roles for testing
ROLES=("production_manager" "quality_inspector")
for ROLE in "${ROLES[@]}"; do
  ROLE_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${ROLE}" \
    -H "Authorization: Bearer ${TOKEN}" | jq -r '.id')

  if [ "$ROLE_ID" != "null" ] && [ ! -z "$ROLE_ID" ]; then
    curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_ID}/role-mappings/realm" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "[{
        \"id\": \"${ROLE_ID}\",
        \"name\": \"${ROLE}\"
      }]"
    echo "✅ Role ${ROLE} assigned"
  fi
done

echo ""
echo "🎉 Admin user created successfully!"
echo ""
echo "Login credentials:"
echo "  Username: ${TEST_USER}"
echo "  Password: ${TEST_PASSWORD}"
echo ""
echo "Assigned roles:"
echo "  - admin (required for Admin Portal)"
echo "  - production_manager"
echo "  - quality_inspector"
echo ""
echo "You can now login to the Admin Portal at http://localhost:3001"