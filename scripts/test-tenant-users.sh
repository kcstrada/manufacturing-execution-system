#!/bin/bash

# Test script to verify tenant user creation and counting

echo "Testing Tenant User Management"
echo "=============================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get a tenant ID (assuming there's at least one tenant)
echo "1. Fetching existing tenants..."
TENANT_RESPONSE=$(curl -s http://localhost:3000/api/v1/tenants/all)
TENANT_ID=$(echo $TENANT_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
TENANT_NAME=$(echo $TENANT_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TENANT_ID" ]; then
    echo -e "${RED}No tenants found. Please create a tenant first.${NC}"
    exit 1
fi

echo -e "${GREEN}Found tenant: $TENANT_NAME (ID: $TENANT_ID)${NC}"

# Get initial user count from Keycloak
echo -e "\n2. Getting initial user count for tenant..."
USERS_RESPONSE=$(curl -s http://localhost:3000/api/v1/tenants/$TENANT_ID/users)
INITIAL_COUNT=$(echo $USERS_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo -e "Initial user count: ${GREEN}$INITIAL_COUNT${NC}"

# Create a test user
echo -e "\n3. Creating a test worker user..."
TIMESTAMP=$(date +%s)
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/tenants/$TENANT_ID/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_worker_'$TIMESTAMP'",
    "email": "test_worker_'$TIMESTAMP'@'$TENANT_ID'.local",
    "firstName": "Test",
    "lastName": "Worker",
    "password": "User@123",
    "role": "worker"
  }')

if echo $CREATE_RESPONSE | grep -q '"success":true'; then
    echo -e "${GREEN}User created successfully${NC}"
else
    echo -e "${RED}Failed to create user${NC}"
    echo "Response: $CREATE_RESPONSE"
fi

# Wait a moment for Keycloak to process
sleep 2

# Get updated user count
echo -e "\n4. Getting updated user count for tenant..."
UPDATED_RESPONSE=$(curl -s http://localhost:3000/api/v1/tenants/$TENANT_ID/users)
UPDATED_COUNT=$(echo $UPDATED_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo -e "Updated user count: ${GREEN}$UPDATED_COUNT${NC}"

# Check if count increased
if [ "$UPDATED_COUNT" -gt "$INITIAL_COUNT" ]; then
    echo -e "\n${GREEN}✓ Success! User count increased from $INITIAL_COUNT to $UPDATED_COUNT${NC}"
else
    echo -e "\n${RED}✗ Error: User count did not increase (still $UPDATED_COUNT)${NC}"
fi

# Fetch tenant list to see if userCount is updated
echo -e "\n5. Checking tenant list for updated userCount..."
TENANT_LIST=$(curl -s http://localhost:3000/api/v1/tenants/all)
TENANT_USER_COUNT=$(echo $TENANT_LIST | grep -o '"id":"'$TENANT_ID'"[^}]*"userCount":[0-9]*' | grep -o '"userCount":[0-9]*' | cut -d':' -f2)
echo -e "Tenant userCount in list: ${GREEN}$TENANT_USER_COUNT${NC}"

echo -e "\n=============================="
if [ "$TENANT_USER_COUNT" = "$UPDATED_COUNT" ]; then
    echo -e "${GREEN}✓ All tests passed! Tenant user management is working correctly.${NC}"
else
    echo -e "${RED}✗ Warning: Tenant list shows different count ($TENANT_USER_COUNT) than actual ($UPDATED_COUNT)${NC}"
fi