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

# Import users if realm was just created
if [ "$REALM_EXISTS" = "404" ]; then
    echo "Importing initial users..."
    
    # Get MES realm token
    MES_TOKEN=$(curl -s -X POST \
        "http://localhost:8080/realms/mes/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=${KEYCLOAK_ADMIN:-admin}" \
        -d "password=${KEYCLOAK_ADMIN_PASSWORD:-admin}" \
        -d "grant_type=password" \
        -d "client_id=admin-cli" | jq -r '.access_token')
    
    # Read users from JSON file and create them
    jq -c '.[]' /opt/keycloak/scripts/../users/initial-users.json | while read user; do
        USERNAME=$(echo $user | jq -r '.username')
        echo "Creating user: $USERNAME"
        
        curl -s -X POST \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$user" \
            "http://localhost:8080/admin/realms/mes/users"
    done
    
    echo "Initial users imported successfully"
fi

echo "Keycloak initialization completed!"