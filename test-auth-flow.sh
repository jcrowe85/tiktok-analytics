#!/bin/bash

# Test Authentication Flow
echo "🧪 Testing TikTok Analytics Authentication Flow"
echo "================================================"
echo ""

# Generate random email to avoid conflicts
RANDOM_EMAIL="test$(date +%s)@example.com"
PASSWORD="testpassword123"
NAME="Test User"

echo "📝 Test 1: Register new user"
echo "Email: $RANDOM_EMAIL"
echo "Password: $PASSWORD"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}")

echo "Response:"
echo "$REGISTER_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Registration successful!"
    echo "Token: ${TOKEN:0:20}..."
else
    echo "❌ Registration failed!"
    exit 1
fi

echo ""
echo "👤 Test 2: Login with registered user"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Response:"
echo "$LOGIN_RESPONSE" | jq .

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$LOGIN_TOKEN" != "null" ] && [ -n "$LOGIN_TOKEN" ]; then
    echo "✅ Login successful!"
else
    echo "❌ Login failed!"
    exit 1
fi

echo ""
echo "🔐 Test 3: Verify token"
echo ""

VERIFY_RESPONSE=$(curl -s http://localhost:5173/api/auth/verify \
  -H "Authorization: Bearer $LOGIN_TOKEN")

echo "Response:"
echo "$VERIFY_RESPONSE" | jq .

USER_EMAIL=$(echo "$VERIFY_RESPONSE" | jq -r '.user.email')

if [ "$USER_EMAIL" == "$RANDOM_EMAIL" ]; then
    echo "✅ Token verification successful!"
else
    echo "❌ Token verification failed!"
    exit 1
fi

echo ""
echo "================================================"
echo "✅ All authentication tests passed!"
echo "================================================"

