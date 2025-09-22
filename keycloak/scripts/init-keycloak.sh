#!/bin/bash

# Keycloak initialization script
# This script is used to initialize Keycloak with custom configuration

set -e

echo "Starting Keycloak initialization..."

# Wait for Keycloak to be ready
until curl -f -s http://localhost:8080/health/ready > /dev/null; do
    echo "Waiting for Keycloak to be ready..."
    sleep 5
done

echo "Keycloak is ready!"

# Get admin token
ACCESS_TOKEN=$(curl -s -X POST \
    "http://localhost:8080/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN:-admin}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD:-admin}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Failed to get admin access token"
    exit 1
fi

echo "Admin access token obtained successfully"

# Check if MES realm exists
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "http://localhost:8080/admin/realms/mes")

if [ "$REALM_EXISTS" = "404" ]; then
    echo "MES realm not found, importing..."
    
    # Import realm configuration
    curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d @/opt/keycloak/data/import/mes-realm.json \
        "http://localhost:8080/admin/realms"
    
    echo "MES realm imported successfully"
else
    echo "MES realm already exists"
fi

# Configure MES theme for the realm
echo "Configuring MES theme..."
curl -s -X PUT \
    "http://localhost:8080/admin/realms/mes" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "loginTheme": "mes",
        "accountTheme": "mes",
        "adminTheme": "mes",
        "emailTheme": "mes"
    }'
echo "MES theme configured successfully"

# Configure clients and role mappings
echo "Configuring clients and role mappings..."

# Get admin-portal client ID
ADMIN_PORTAL_CLIENT_ID=$(curl -s -X GET \
    "http://localhost:8080/admin/realms/mes/clients?clientId=admin-portal" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[0].id')

if [ ! -z "$ADMIN_PORTAL_CLIENT_ID" ] && [ "$ADMIN_PORTAL_CLIENT_ID" != "null" ]; then
    echo "Configuring admin-portal client (ID: $ADMIN_PORTAL_CLIENT_ID)"

    # Enable full scope allowed for admin-portal client
    curl -s -X PUT \
        "http://localhost:8080/admin/realms/mes/clients/$ADMIN_PORTAL_CLIENT_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "fullScopeAllowed": true
        }'

    # Add realm roles mapper
    curl -s -X POST \
        "http://localhost:8080/admin/realms/mes/clients/$ADMIN_PORTAL_CLIENT_ID/protocol-mappers/models" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "realm-roles",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-realm-role-mapper",
            "consentRequired": false,
            "config": {
                "multivalued": "true",
                "usermodel.realmRoleMapping.rolePrefix": "",
                "claim.name": "roles",
                "jsonType.label": "String",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "userinfo.token.claim": "true"
            }
        }' 2>/dev/null || echo "Realm roles mapper might already exist"

    # Add realm_access.roles mapper for compatibility
    curl -s -X POST \
        "http://localhost:8080/admin/realms/mes/clients/$ADMIN_PORTAL_CLIENT_ID/protocol-mappers/models" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "realm-access-roles",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-realm-role-mapper",
            "consentRequired": false,
            "config": {
                "multivalued": "true",
                "usermodel.realmRoleMapping.rolePrefix": "",
                "claim.name": "realm_access.roles",
                "jsonType.label": "String",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "userinfo.token.claim": "false"
            }
        }' 2>/dev/null || echo "Realm access roles mapper might already exist"

    echo "Admin-portal client configured successfully"
fi

# Configure user-portal client
USER_PORTAL_CLIENT_ID=$(curl -s -X GET \
    "http://localhost:8080/admin/realms/mes/clients?clientId=user-portal" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[0].id')

if [ ! -z "$USER_PORTAL_CLIENT_ID" ] && [ "$USER_PORTAL_CLIENT_ID" != "null" ]; then
    echo "Configuring user-portal client (ID: $USER_PORTAL_CLIENT_ID)"

    # Enable full scope allowed for user-portal client
    curl -s -X PUT \
        "http://localhost:8080/admin/realms/mes/clients/$USER_PORTAL_CLIENT_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "fullScopeAllowed": true
        }'

    # Add the same role mappers to user-portal
    curl -s -X POST \
        "http://localhost:8080/admin/realms/mes/clients/$USER_PORTAL_CLIENT_ID/protocol-mappers/models" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "realm-roles",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-realm-role-mapper",
            "consentRequired": false,
            "config": {
                "multivalued": "true",
                "usermodel.realmRoleMapping.rolePrefix": "",
                "claim.name": "roles",
                "jsonType.label": "String",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "userinfo.token.claim": "true"
            }
        }' 2>/dev/null || echo "Realm roles mapper might already exist"

    curl -s -X POST \
        "http://localhost:8080/admin/realms/mes/clients/$USER_PORTAL_CLIENT_ID/protocol-mappers/models" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "realm-access-roles",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-realm-role-mapper",
            "consentRequired": false,
            "config": {
                "multivalued": "true",
                "usermodel.realmRoleMapping.rolePrefix": "",
                "claim.name": "realm_access.roles",
                "jsonType.label": "String",
                "id.token.claim": "true",
                "access.token.claim": "true",
                "userinfo.token.claim": "false"
            }
        }' 2>/dev/null || echo "Realm access roles mapper might already exist"

    echo "User-portal client configured successfully"
fi

# Import users if realm was just created
if [ "$REALM_EXISTS" = "404" ]; then
    echo "Importing initial users..."

    # Read users from JSON file and create them
    if [ -f "/opt/keycloak/scripts/../users/initial-users.json" ]; then
        jq -c '.[]' /opt/keycloak/scripts/../users/initial-users.json | while read user; do
            USERNAME=$(echo $user | jq -r '.username')
            echo "Creating user: $USERNAME"

            USER_ID=$(curl -s -X POST \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -H "Content-Type: application/json" \
                -d "$user" \
                "http://localhost:8080/admin/realms/mes/users" \
                -w "\n%{http_code}" | tail -n 1)

            if [ "$USER_ID" = "201" ]; then
                echo "User $USERNAME created successfully"

                # Get user ID for role assignment
                CREATED_USER_ID=$(curl -s -X GET \
                    "http://localhost:8080/admin/realms/mes/users?username=$USERNAME" \
                    -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[0].id')

                # Assign roles based on username
                if [ "$USERNAME" = "admin" ] || [ "$USERNAME" = "superadmin" ]; then
                    # Get super_admin role ID
                    SUPER_ADMIN_ROLE_ID=$(curl -s -X GET \
                        "http://localhost:8080/admin/realms/mes/roles/super_admin" \
                        -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.id')

                    if [ ! -z "$SUPER_ADMIN_ROLE_ID" ] && [ "$SUPER_ADMIN_ROLE_ID" != "null" ]; then
                        curl -s -X POST \
                            "http://localhost:8080/admin/realms/mes/users/$CREATED_USER_ID/role-mappings/realm" \
                            -H "Authorization: Bearer $ACCESS_TOKEN" \
                            -H "Content-Type: application/json" \
                            -d "[{\"id\":\"$SUPER_ADMIN_ROLE_ID\",\"name\":\"super_admin\"}]"
                        echo "Assigned super_admin role to $USERNAME"
                    fi
                fi
            fi
        done

        echo "Initial users imported successfully"
    else
        echo "No initial users file found, skipping user import"
    fi
fi

echo "Keycloak initialization completed!"