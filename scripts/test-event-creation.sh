#!/bin/bash
# Test Event Creation Flow - Sprint 2

echo "🔥 Testing Event Creation API..."
echo ""

# Test 1: Create a test event
echo "📝 Creating test wedding event..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/forge/projects \
  -H "Content-Type: application/json" \
  -d '{
    "clientBrief": {
      "event_type": "Wedding",
      "date": "2025-06-15",
      "city": "Mumbai",
      "guest_count": "200",
      "venue_status": "Not yet booked"
    },
    "title": "Test Wedding - Sprint 2",
    "userId": "test-user-123"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Extract event ID if successful
EVENT_ID=$(echo "$RESPONSE" | jq -r '.forgeProject.id // empty')

if [ -z "$EVENT_ID" ]; then
  echo "❌ Event creation failed"
  exit 1
fi

echo "✅ Event created successfully: $EVENT_ID"
echo ""

# Test 2: Fetch the created event
echo "📖 Fetching created event..."
curl -s "http://localhost:3000/api/forge/projects/$EVENT_ID" | jq '.'
echo ""

echo "🎉 Event creation flow test complete!"
