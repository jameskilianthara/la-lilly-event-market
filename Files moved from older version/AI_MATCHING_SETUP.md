# AI-Powered Vendor Matching Setup Guide

## Overview
The AI matching system uses Anthropic Claude-3 for natural language processing and OpenAI for semantic embeddings to provide intelligent vendor recommendations based on event requirements.

## Prerequisites

### 1. API Keys Required
- **OpenAI API Key**: For generating semantic embeddings
- **Anthropic API Key**: For parsing natural language event descriptions
- **Redis**: For caching embeddings and improving performance

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:

```bash
# AI Services
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Redis Cache
REDIS_URL=redis://localhost:6379
```

### 3. Install Redis
For development:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# Windows
# Download from https://redis.io/download
```

### 4. Install Dependencies
```bash
cd server
npm install @anthropic-ai/sdk openai redis
```

## Architecture Overview

### Backend Components
1. **AIVendorMatcher** (`/server/services/aiMatching.js`)
   - Main matching engine with semantic analysis
   - Multi-dimensional scoring algorithm
   - Caching and performance optimization

2. **API Routes** (`/server/routes/aiMatching.js`)
   - `/api/ai/match-vendors` - Main matching endpoint
   - `/api/ai/parse-event` - Event description parsing
   - `/api/ai/feedback` - Learning feedback collection
   - `/api/ai/chatbot-match` - Chatbot integration

3. **Models** (`/server/models/index.js`)
   - MatchingFeedback schema for learning loops
   - Enhanced Vendor and Event schemas

### Frontend Components
1. **AIVendorMatcher** (`/client/src/components/AIVendorMatcher.jsx`)
   - React component for displaying AI matches
   - Real-time matching progress
   - Match explanations and scoring

2. **Integration** (`/client/src/ClientEventChatBuilder.jsx`)
   - Integrated into Plan My Event chatbot flow
   - Automatic trigger after event requirements collection

## How It Works

### 1. Event Description Parsing
```javascript
// Natural language input
"I need a traditional Indian wedding for 500 guests in Mumbai with catering, decorations, and photography"

// AI-parsed output
{
  eventType: "wedding",
  services: ["catering", "decorations", "photography"],
  budget: { min: 500000, max: 1000000, currency: "INR" },
  style: "traditional",
  culturalContext: "Indian",
  venue: { capacity: 500, type: "indoor" },
  location: "Mumbai"
}
```

### 2. Semantic Matching Process
1. **Embedding Generation**: Convert service descriptions to vectors
2. **Vendor Scoring**: Multi-dimensional algorithm considering:
   - Semantic service match (40%)
   - Location proximity (25%)
   - Quality rating (20%)
   - Price competitiveness (10%)
   - Availability (5%)
3. **Ranking**: Sort vendors by total score with explanations

### 3. Learning Loop
- Track client interactions with recommended vendors
- Collect feedback on match quality
- Store data for future algorithm improvements

## API Usage Examples

### Match Vendors
```javascript
POST /api/ai/match-vendors
{
  "eventRequirements": {
    "description": "Corporate conference for 200 attendees",
    "budget": 300000,
    "location": "Delhi",
    "eventDate": "2024-03-15",
    "guestCount": 200
  },
  "options": {
    "limit": 10,
    "includeExplanations": true
  }
}
```

### Parse Event Description
```javascript
POST /api/ai/parse-event
{
  "description": "Need a birthday party setup with decorations and catering for 50 people",
  "basicRequirements": {
    "budget": 25000,
    "location": "Bangalore"
  }
}
```

### Submit Feedback
```javascript
POST /api/ai/feedback
{
  "sessionId": "match_1234567890_client123",
  "vendorFeedback": [{
    "vendorId": "vendor_id_here",
    "wasContacted": true,
    "wasHired": false,
    "rating": 4,
    "issues": ["price_too_high"]
  }],
  "overallRating": 4,
  "comments": "Good matches but slightly expensive"
}
```

## Performance Optimization

### Caching Strategy
- **Embeddings**: 24-hour cache for service embeddings
- **Parsed Requirements**: 1-hour cache for Claude responses
- **Vendor Data**: Database-level caching for frequent queries

### Scalability Considerations
- Redis clustering for high-traffic scenarios
- Rate limiting on AI API calls
- Batch processing for multiple vendor scoring

## Integration with Plan My Event Chatbot

The AI matching is seamlessly integrated into the existing chatbot flow:

1. **Trigger**: Automatically starts after event requirements collection
2. **Modal Display**: Shows AI matching results in an overlay
3. **User Actions**: Contact vendors, view profiles, provide feedback
4. **Continuation**: Proceeds to WhatsApp integration with vendor list

## Monitoring and Analytics

Track system performance with:
- Matching success rates
- API response times
- Client satisfaction scores
- Vendor contact/hire conversion rates

## Future Enhancements

1. **Machine Learning**: Replace rule-based scoring with trained models
2. **Real-time Availability**: Integration with vendor calendars
3. **Price Prediction**: Dynamic pricing based on market data
4. **A/B Testing**: Compare AI vs. traditional matching performance
5. **Voice Integration**: Support for voice-based event planning

## Troubleshooting

### Common Issues
1. **Redis Connection**: Ensure Redis is running on specified port
2. **API Limits**: Monitor OpenAI/Anthropic usage and implement rate limiting
3. **Cache Misses**: Check Redis memory limits and eviction policies
4. **Slow Responses**: Optimize vendor queries and consider database indexing

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=ai-matching
```

## Security Considerations

- Store API keys securely (never commit to version control)
- Implement rate limiting to prevent abuse
- Sanitize user inputs before AI processing
- Monitor for potential prompt injection attacks
- Regular security audits of AI service usage