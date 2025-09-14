#!/bin/bash

# Google Generative AI API Validation Script
# Tests if your GOOGLE_API_KEY is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Testing Google Generative AI API credentials...${NC}\n"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with your GOOGLE_API_KEY"
    exit 1
fi

# Load environment variables
source .env

# Check if API key is set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${RED}❌ Error: GOOGLE_API_KEY not found in .env file${NC}"
    echo "Please add your Google AI Studio API key to .env:"
    echo "GOOGLE_API_KEY=your_api_key_here"
    exit 1
fi

# Test the API
echo -e "${YELLOW}📡 Making test request to Gemini API...${NC}\n"

response=$(curl -s -w "\n%{http_code}" \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
  -H 'Content-Type: application/json' \
  -H "X-goog-api-key: $GOOGLE_API_KEY" \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }')

# Extract HTTP status code (last line)
http_code=$(echo "$response" | tail -n1)
# Extract response body (everything except last line)
response_body=$(echo "$response" | sed '$d')

echo -e "${YELLOW}HTTP Status Code:${NC} $http_code\n"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Success! Your API key is working correctly.${NC}\n"
    echo -e "${YELLOW}API Response:${NC}"
    echo "$response_body" | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null || echo "$response_body"
    echo
    echo -e "${GREEN}🎉 You're ready to run the Action Figure Builder!${NC}"
    echo "Run: npm run demo"
else
    echo -e "${RED}❌ API request failed${NC}\n"
    echo -e "${YELLOW}Response:${NC}"
    echo "$response_body"
    echo
    echo -e "${YELLOW}Common issues:${NC}"
    echo "• Invalid API key"
    echo "• API key doesn't have access to Gemini models"
    echo "• Rate limiting or quota exceeded"
    echo "• Check your Google AI Studio dashboard: https://aistudio.google.com/"
fi