#!/bin/bash

# OpenFGA Seed Data Script
# This script adds sample authorization data for testing

set -e

# Configuration
OPENFGA_API_URL="${OPENFGA_API_URL:-http://localhost:8081}"
OPENFGA_API_TOKEN="${OPENFGA_API_TOKEN:-secret}"
STORE_ID="${OPENFGA_STORE_ID:-01K4NEQQT8SE7SX8ZW2ZK8EY2C}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🌱 Seeding OpenFGA with sample data...${NC}"

# Helper function to write tuples
write_tuple() {
    local user=$1
    local relation=$2
    local object=$3
    
    curl -s -X POST "${OPENFGA_API_URL}/stores/${STORE_ID}/write" \
        -H "Authorization: Bearer ${OPENFGA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"writes\": {
                \"tuple_keys\": [
                    {
                        \"user\": \"${user}\",
                        \"relation\": \"${relation}\",
                        \"object\": \"${object}\"
                    }
                ]
            }
        }" > /dev/null
    
    echo "  ✓ ${user} ${relation} ${object}"
}

echo "Creating tenant relationships..."
write_tuple "user:admin" "admin" "tenant:default"
write_tuple "user:executive" "member" "tenant:default"
write_tuple "user:sales" "member" "tenant:default"
write_tuple "user:worker" "member" "tenant:default"

echo ""
echo "Creating organization relationships..."
write_tuple "tenant:default" "tenant" "organization:acme-corp"
write_tuple "user:admin" "owner" "organization:acme-corp"
write_tuple "user:executive" "executive" "organization:acme-corp"
write_tuple "user:sales" "sales" "organization:acme-corp"
write_tuple "user:worker" "worker" "organization:acme-corp"
write_tuple "user:worker2" "worker" "organization:acme-corp"

echo ""
echo "Creating sample orders..."
# Order 1 - Created by sales, assigned to worker
write_tuple "organization:acme-corp" "organization" "order:order-001"
write_tuple "user:sales" "creator" "order:order-001"
write_tuple "user:worker" "assigned" "order:order-001"

# Order 2 - Created by executive, assigned to worker2
write_tuple "organization:acme-corp" "organization" "order:order-002"
write_tuple "user:executive" "creator" "order:order-002"
write_tuple "user:worker2" "assigned" "order:order-002"

echo ""
echo "Creating sample tasks..."
# Tasks for Order 1
write_tuple "order:order-001" "order" "task:task-001"
write_tuple "user:worker" "assigned" "task:task-001"

write_tuple "order:order-001" "order" "task:task-002"
write_tuple "user:worker" "assigned" "task:task-002"

# Tasks for Order 2
write_tuple "order:order-002" "order" "task:task-003"
write_tuple "user:worker2" "assigned" "task:task-003"

echo ""
echo "Creating inventory relationships..."
write_tuple "organization:acme-corp" "organization" "inventory:warehouse-01"

echo ""
echo -e "${GREEN}🎉 Sample data seeded successfully!${NC}"
echo ""
echo "Sample hierarchy created:"
echo "  Tenant: default"
echo "    └── Organization: acme-corp"
echo "          ├── Users:"
echo "          │   ├── admin (owner)"
echo "          │   ├── executive (executive)"
echo "          │   ├── sales (sales)"
echo "          │   ├── worker (worker)"
echo "          │   └── worker2 (worker)"
echo "          ├── Orders:"
echo "          │   ├── order-001 (created by sales, assigned to worker)"
echo "          │   │   ├── task-001 (assigned to worker)"
echo "          │   │   └── task-002 (assigned to worker)"
echo "          │   └── order-002 (created by executive, assigned to worker2)"
echo "          │       └── task-003 (assigned to worker2)"
echo "          └── Inventory:"
echo "              └── warehouse-01"