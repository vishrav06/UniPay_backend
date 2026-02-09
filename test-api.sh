#!/bin/bash

echo "=== UniPay Backend API Tests ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo -e "${BLUE}1. Health Check${NC}"
curl -s "$API_URL/health" | jq .
echo ""

echo -e "${BLUE}2. API Info${NC}"
curl -s "$API_URL/" | jq .
echo ""

echo -e "${BLUE}3. Get Student Profile (will fail if student doesn't exist)${NC}"
curl -s "$API_URL/api/students/21BCE123" | jq .
echo ""

echo -e "${BLUE}4. Get Vendor Profile (will fail if vendor doesn't exist)${NC}"
curl -s "$API_URL/api/vendors/V001" | jq .
echo ""

echo -e "${BLUE}5. Create Transaction (will fail if student/vendor don't exist)${NC}"
curl -s -X POST "$API_URL/api/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "registration_number": "21BCE123",
    "vendorid": "V001",
    "amount": 150.50
  }' | jq .
echo ""

echo -e "${BLUE}6. Get Student Monthly Spending${NC}"
curl -s "$API_URL/api/students/21BCE123/monthly-spending" | jq .
echo ""

echo -e "${BLUE}7. Get Vendor Monthly Earnings${NC}"
curl -s "$API_URL/api/vendors/V001/monthly-earnings" | jq .
echo ""

echo -e "${BLUE}8. Get All Students Spending (Admin)${NC}"
curl -s "$API_URL/api/admin/students/monthly-spending" | jq .
echo ""

echo -e "${BLUE}9. Get All Vendors Earnings (Admin)${NC}"
curl -s "$API_URL/api/admin/vendors/monthly-earnings" | jq .
echo ""

echo -e "${GREEN}Tests completed!${NC}"
