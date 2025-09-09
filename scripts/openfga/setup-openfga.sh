#!/bin/bash

# OpenFGA Setup Script for Manufacturing Execution System
# This script creates the OpenFGA store and applies the authorization model

set -e

# Configuration
OPENFGA_API_URL="${OPENFGA_API_URL:-http://localhost:8081}"
OPENFGA_API_TOKEN="${OPENFGA_API_TOKEN:-secret}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔐 Setting up OpenFGA for Manufacturing Execution System...${NC}"

# Wait for OpenFGA to be ready
echo "Waiting for OpenFGA to be ready..."
until curl -s -f -o /dev/null "${OPENFGA_API_URL}/healthz"; do
    echo "OpenFGA is not ready yet. Waiting..."
    sleep 2
done
echo -e "${GREEN}✅ OpenFGA is ready!${NC}"

# Create a new store
echo "Creating OpenFGA store..."
STORE_RESPONSE=$(curl -s -X POST "${OPENFGA_API_URL}/stores" \
    -H "Authorization: Bearer ${OPENFGA_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Manufacturing Execution System",
        "description": "Authorization store for MES application"
    }')

STORE_ID=$(echo "$STORE_RESPONSE" | jq -r '.id')

if [ "$STORE_ID" == "null" ] || [ -z "$STORE_ID" ]; then
    echo -e "${RED}❌ Failed to create store${NC}"
    echo "Response: $STORE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Store created with ID: ${STORE_ID}${NC}"

# Apply the authorization model
echo "Applying authorization model..."
MODEL_RESPONSE=$(curl -s -X POST "${OPENFGA_API_URL}/stores/${STORE_ID}/authorization-models" \
    -H "Authorization: Bearer ${OPENFGA_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d @scripts/openfga/model-simple.json)

MODEL_ID=$(echo "$MODEL_RESPONSE" | jq -r '.authorization_model_id')

if [ "$MODEL_ID" == "null" ] || [ -z "$MODEL_ID" ]; then
    echo -e "${RED}❌ Failed to apply authorization model${NC}"
    echo "Response: $MODEL_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Authorization model applied with ID: ${MODEL_ID}${NC}"

# Save the store ID to a file for later use
echo "$STORE_ID" > scripts/openfga/store_id.txt

# Update .env.example with the store ID
if [ -f ".env.example" ]; then
    if grep -q "OPENFGA_STORE_ID=" .env.example; then
        sed -i.bak "s/OPENFGA_STORE_ID=.*/OPENFGA_STORE_ID=${STORE_ID}/" .env.example
    else
        echo "OPENFGA_STORE_ID=${STORE_ID}" >> .env.example
    fi
    echo -e "${GREEN}✅ Updated .env.example with Store ID${NC}"
fi

# Update .env if it exists
if [ -f ".env" ]; then
    if grep -q "OPENFGA_STORE_ID=" .env; then
        sed -i.bak "s/OPENFGA_STORE_ID=.*/OPENFGA_STORE_ID=${STORE_ID}/" .env
    else
        echo "OPENFGA_STORE_ID=${STORE_ID}" >> .env
    fi
    echo -e "${GREEN}✅ Updated .env with Store ID${NC}"
fi

echo -e "${GREEN}🎉 OpenFGA setup complete!${NC}"
echo ""
echo "Store ID: ${STORE_ID}"
echo "Model ID: ${MODEL_ID}"
echo ""
echo "The authorization model includes the following types:"
echo "  - tenant: Multi-tenancy support"
echo "  - organization: Company/department level"
echo "  - team: Team groupings"
echo "  - order: Manufacturing orders"
echo "  - task: Production tasks"
echo "  - inventory: Material inventory"
echo "  - equipment: Manufacturing equipment"
echo "  - report: Analytics and reports"
echo "  - user: System users"
echo ""
echo "Please restart your backend application to use the new Store ID."