#!/bin/bash

# Keycloak realm backup script
# This script exports the current MES realm configuration

set -e

BACKUP_DIR=${1:-/opt/keycloak/backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/mes-realm-backup-${TIMESTAMP}.json"

echo "Starting realm backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

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

# Export realm configuration
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "http://localhost:8080/admin/realms/mes" \
    | jq '.' > $BACKUP_FILE

if [ -f "$BACKUP_FILE" ]; then
    echo "Realm backup created successfully: $BACKUP_FILE"
    
    # Keep only last 10 backups
    ls -t ${BACKUP_DIR}/mes-realm-backup-*.json | tail -n +11 | xargs -r rm
    echo "Old backups cleaned up (keeping last 10)"
else
    echo "Failed to create backup"
    exit 1
fi