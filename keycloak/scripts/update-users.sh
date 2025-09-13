#!/bin/bash

# Script to update/sync users from initial-users.json
# Useful for updating user attributes or adding new users

set -e

USERS_FILE="/opt/keycloak/scripts/../users/initial-users.json"

echo "Starting user update/sync..."

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

# Process each user in the JSON file
jq -c '.[]' $USERS_FILE | while read user; do
    USERNAME=$(echo $user | jq -r '.username')
    EMAIL=$(echo $user | jq -r '.email')
    
    echo "Processing user: $USERNAME"
    
    # Check if user exists
    USER_ID=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "http://localhost:8080/admin/realms/mes/users?username=$USERNAME&exact=true" \
        | jq -r '.[0].id // empty')
    
    if [ -z "$USER_ID" ]; then
        echo "  Creating new user: $USERNAME"
        
        # Create user
        curl -s -X POST \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$user" \
            "http://localhost:8080/admin/realms/mes/users"
        
        # Get the newly created user ID
        USER_ID=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
            "http://localhost:8080/admin/realms/mes/users?username=$USERNAME&exact=true" \
            | jq -r '.[0].id')
    else
        echo "  Updating existing user: $USERNAME"
        
        # Update user (excluding credentials)
        USER_UPDATE=$(echo $user | jq 'del(.credentials)')
        
        curl -s -X PUT \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$USER_UPDATE" \
            "http://localhost:8080/admin/realms/mes/users/$USER_ID"
    fi
    
    # Update realm roles
    REALM_ROLES=$(echo $user | jq -r '.realmRoles[]?' | tr '\n' ' ')
    if [ ! -z "$REALM_ROLES" ]; then
        echo "  Assigning realm roles: $REALM_ROLES"
        
        # Get role representations
        ROLE_JSON="["
        FIRST=true
        for ROLE in $REALM_ROLES; do
            ROLE_DATA=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
                "http://localhost:8080/admin/realms/mes/roles/$ROLE")
            
            if [ "$FIRST" = true ]; then
                FIRST=false
            else
                ROLE_JSON="$ROLE_JSON,"
            fi
            ROLE_JSON="$ROLE_JSON$ROLE_DATA"
        done
        ROLE_JSON="$ROLE_JSON]"
        
        # Assign roles
        curl -s -X POST \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$ROLE_JSON" \
            "http://localhost:8080/admin/realms/mes/users/$USER_ID/role-mappings/realm"
    fi
done

echo "User update/sync completed!"