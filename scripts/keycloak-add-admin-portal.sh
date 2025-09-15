#!/bin/bash

# Keycloak configuration
KEYCLOAK_URL="http://localhost:8080"
REALM="MES"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

echo "🔐 Adding admin-portal client to Keycloak..."

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

# Create admin-portal client
echo "Creating admin-portal client..."
CLIENT_RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "admin-portal",
    "name": "Admin Portal",
    "description": "Manufacturing Execution System Admin Portal",
    "publicClient": true,
    "directAccessGrantsEnabled": true,
    "enabled": true,
    "protocol": "openid-connect",
    "attributes": {
      "pkce.code.challenge.method": "S256"
    },
    "webOrigins": [
      "http://localhost:3001",
      "http://localhost:3000",
      "+"
    ],
    "redirectUris": [
      "http://localhost:3001/*",
      "http://localhost:3000/*"
    ],
    "defaultClientScopes": [
      "web-origins",
      "profile",
      "roles",
      "email"
    ],
    "optionalClientScopes": [
      "address",
      "phone",
      "offline_access",
      "microprofile-jwt"
    ]
  }')

# Check if client was created successfully
if echo "$CLIENT_RESPONSE" | grep -q "error"; then
  if echo "$CLIENT_RESPONSE" | grep -q "Client admin-portal already exists"; then
    echo "⚠️  Client admin-portal already exists, updating it..."

    # Get client ID
    CLIENT_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=admin-portal" \
      -H "Authorization: Bearer ${TOKEN}" | jq -r '.[0].id')

    # Update existing client
    curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "clientId": "admin-portal",
        "name": "Admin Portal",
        "description": "Manufacturing Execution System Admin Portal",
        "publicClient": true,
        "directAccessGrantsEnabled": true,
        "enabled": true,
        "protocol": "openid-connect",
        "attributes": {
          "pkce.code.challenge.method": "S256"
        },
        "webOrigins": [
          "http://localhost:3001",
          "http://localhost:3000",
          "+"
        ],
        "redirectUris": [
          "http://localhost:3001/*",
          "http://localhost:3000/*"
        ],
        "defaultClientScopes": [
          "web-origins",
          "profile",
          "roles",
          "email"
        ],
        "optionalClientScopes": [
          "address",
          "phone",
          "offline_access",
          "microprofile-jwt"
        ]
      }'
    echo "✅ Client admin-portal updated successfully"
  else
    echo "❌ Failed to create client: $CLIENT_RESPONSE"
    exit 1
  fi
else
  echo "✅ Client admin-portal created successfully"
fi

# Create user-portal client as well
echo "Creating user-portal client..."
CLIENT_RESPONSE=$(curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "user-portal",
    "name": "User Portal",
    "description": "Manufacturing Execution System User Portal",
    "publicClient": true,
    "directAccessGrantsEnabled": true,
    "enabled": true,
    "protocol": "openid-connect",
    "attributes": {
      "pkce.code.challenge.method": "S256"
    },
    "webOrigins": [
      "http://localhost:3002",
      "http://localhost:3000",
      "+"
    ],
    "redirectUris": [
      "http://localhost:3002/*",
      "http://localhost:3000/*"
    ],
    "defaultClientScopes": [
      "web-origins",
      "profile",
      "roles",
      "email"
    ],
    "optionalClientScopes": [
      "address",
      "phone",
      "offline_access",
      "microprofile-jwt"
    ]
  }')

if echo "$CLIENT_RESPONSE" | grep -q "error"; then
  if echo "$CLIENT_RESPONSE" | grep -q "Client user-portal already exists"; then
    echo "⚠️  Client user-portal already exists"
  else
    echo "⚠️  Could not create user-portal client: $CLIENT_RESPONSE"
  fi
else
  echo "✅ Client user-portal created successfully"
fi

echo ""
echo "🎉 Keycloak clients configured successfully!"
echo ""
echo "Admin Portal client:"
echo "  - Client ID: admin-portal"
echo "  - URL: http://localhost:3001"
echo ""
echo "User Portal client:"
echo "  - Client ID: user-portal"
echo "  - URL: http://localhost:3002"