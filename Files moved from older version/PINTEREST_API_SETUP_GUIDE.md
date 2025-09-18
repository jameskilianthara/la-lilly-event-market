# Pinterest API v5 Setup Guide

This guide will walk you through setting up Pinterest API v5 credentials for the Pinterest-AI Enhanced Event System.

## Table of Contents
1. [Pinterest Developer Account Setup](#pinterest-developer-account-setup)
2. [Creating a Pinterest App](#creating-a-pinterest-app)
3. [Getting API Credentials](#getting-api-credentials)
4. [Setting Up OAuth 2.0](#setting-up-oauth-20)
5. [Testing Your Setup](#testing-your-setup)
6. [Rate Limits and Best Practices](#rate-limits-and-best-practices)
7. [Troubleshooting](#troubleshooting)

## Prerequisites
- A Pinterest business account (required for API access)
- Basic understanding of OAuth 2.0 flow
- Node.js development environment

## Pinterest Developer Account Setup

### Step 1: Create a Pinterest Business Account
1. Go to [Pinterest Business](https://business.pinterest.com/)
2. Click "Create account" or convert your personal Pinterest account
3. Fill in your business information
4. Verify your email address

### Step 2: Apply for Developer Access
1. Visit [Pinterest Developers](https://developers.pinterest.com/)
2. Click "Get Started" 
3. Sign in with your Pinterest business account
4. Complete the developer application:
   - **Company/Organization**: Your business name
   - **Use Case**: Event planning and visual inspiration
   - **Description**: Pinterest-AI Enhanced Event Planning System for visual inspiration and vendor matching
   - **Website**: Your application URL (can be localhost for development)

## Creating a Pinterest App

### Step 1: Create New App
1. Go to [Pinterest Developer Console](https://developers.pinterest.com/apps/)
2. Click "Create app"
3. Fill in app details:
   - **App name**: Pinterest-AI Event System
   - **App description**: AI-powered event planning with Pinterest visual inspiration
   - **App website**: Use a free hosting service (see options below)
   - **Redirect URI**: Use your hosted website URL + `/auth/pinterest/callback`
   - **App category**: Lifestyle
   - **Terms of Service**: Your hosted website URL + `/terms`
   - **Privacy Policy**: Your hosted website URL + `/privacy`

### 🌐 Free Website Hosting Options (Choose One):

**Option A: Netlify (Recommended - Easiest)**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with your email
3. Create a simple site by uploading an HTML file or connecting to GitHub
4. You'll get a free URL like: `https://your-app-name.netlify.app`

**Option B: Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub/Google
3. Deploy a simple site
4. Get URL like: `https://your-app-name.vercel.app`

**Option C: GitHub Pages**
1. Create a GitHub account
2. Create a repository named `pinterest-ai-events`
3. Enable GitHub Pages in settings
4. Get URL like: `https://yourusername.github.io/pinterest-ai-events`

**Quick Setup for Any Option:**
- Create a simple `index.html` file with basic content about your event planning app
- Add basic `/terms` and `/privacy` pages (can be simple text)
- Use this hosted URL in your Pinterest app settings

### Step 2: Configure App Settings
1. In your app dashboard, go to "App Settings"
2. Configure the following:
   - **Platform**: Web
   - **Redirect URIs**: Add your hosted website URL
     - Example: `https://your-app-name.netlify.app/auth/pinterest/callback`
     - ⚠️ **Important**: Must use HTTPS (secure) URL, not HTTP

## Getting API Credentials

### Step 1: Locate Your Credentials
1. In your Pinterest app dashboard, go to "App Settings"
2. You'll find:
   - **App ID**: This is your `VITE_PINTEREST_APP_ID`
   - **App Secret**: This is your `VITE_PINTEREST_APP_SECRET`

### Step 2: Generate Access Token
For development, you can use the Pinterest API Explorer or implement OAuth flow:

#### Option A: Pinterest API Explorer (Quick Setup)
1. Go to [Pinterest API Explorer](https://developers.pinterest.com/tools/api-explorer/)
2. Sign in with your business account
3. Generate a token with required scopes:
   - `boards:read`
   - `pins:read`
   - `user_accounts:read`
4. Copy the generated token as your `VITE_PINTEREST_ACCESS_TOKEN`

#### Option B: OAuth 2.0 Flow (Production)
For production, implement the full OAuth flow. See the OAuth section below.

## Setting Up OAuth 2.0

### Authorization URL
```
https://www.pinterest.com/oauth/?
  client_id=YOUR_APP_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=boards:read,pins:read,user_accounts:read&
  response_type=code&
  state=YOUR_RANDOM_STATE_STRING
```

### Token Exchange
```bash
curl -X POST https://api.pinterest.com/v5/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_APP_ID" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=YOUR_REDIRECT_URI"
```

### Required Scopes
For the Pinterest-AI Event System, you need these scopes:
- `boards:read` - Read user's boards
- `pins:read` - Read user's pins
- `user_accounts:read` - Read basic user info

## Configuring Environment Variables

### Step 1: Copy Environment Template
```bash
cd /Users/jameskilianthara/Desktop/event-marketplace/client
cp .env.example .env.local
```

### Step 2: Fill in Pinterest Credentials
Edit `.env.local` and replace:
```env
# Pinterest API v5 Configuration
VITE_PINTEREST_APP_ID=1234567890123456789
VITE_PINTEREST_APP_SECRET=your_32_character_app_secret_here
VITE_PINTEREST_ACCESS_TOKEN=your_access_token_here

# Pinterest API Settings
VITE_PINTEREST_API_VERSION=v5
VITE_PINTEREST_BASE_URL=https://api.pinterest.com/v5
VITE_PINTEREST_RATE_LIMIT_PER_HOUR=1000
VITE_PINTEREST_RATE_LIMIT_PER_DAY=200000
```

## Testing Your Setup

### Step 1: Test API Connection
Create a test file to verify your Pinterest API setup:

```javascript
// test-pinterest-api.js
const testPinterestAPI = async () => {
  const appId = process.env.VITE_PINTEREST_APP_ID;
  const accessToken = process.env.VITE_PINTEREST_ACCESS_TOKEN;
  
  try {
    const response = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Pinterest API connection successful!');
      console.log('User:', data.username);
      return true;
    } else {
      console.error('❌ Pinterest API connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Pinterest API error:', error);
    return false;
  }
};

testPinterestAPI();
```

### Step 2: Test Search Functionality
```javascript
// test-pinterest-search.js
const testPinterestSearch = async () => {
  const accessToken = process.env.VITE_PINTEREST_ACCESS_TOKEN;
  
  try {
    const searchQuery = 'elegant wedding decor';
    const response = await fetch(`https://api.pinterest.com/v5/search/pins?query=${encodeURIComponent(searchQuery)}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Pinterest search successful!');
      console.log(`Found ${data.items.length} pins for "${searchQuery}"`);
      return data;
    } else {
      console.error('❌ Pinterest search failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Pinterest search error:', error);
    return null;
  }
};

testPinterestSearch();
```

## Rate Limits and Best Practices

### Pinterest API v5 Rate Limits
- **Hourly Limit**: 1,000 requests per hour per user
- **Daily Limit**: 200,000 requests per day per app
- **Burst Limit**: 50 requests per minute

### Best Practices
1. **Implement Caching**: Cache search results for 1 hour
2. **Rate Limiting**: Implement exponential backoff
3. **Error Handling**: Handle 429 (rate limit) responses gracefully
4. **Batch Requests**: Group multiple operations when possible
5. **Monitor Usage**: Track API usage through Pinterest Developer Console

### Example Rate Limiting Implementation
```javascript
class PinterestRateLimit {
  constructor() {
    this.requestTimes = [];
    this.maxRequestsPerHour = 1000;
  }
  
  async makeRequest(url, options) {
    // Check rate limit
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    this.requestTimes = this.requestTimes.filter(time => time > oneHourAgo);
    
    if (this.requestTimes.length >= this.maxRequestsPerHour) {
      throw new Error('Rate limit exceeded');
    }
    
    // Make request
    const response = await fetch(url, options);
    this.requestTimes.push(now);
    
    // Handle rate limit response
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.makeRequest(url, options);
    }
    
    return response;
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "Invalid App ID" Error
- **Cause**: Wrong App ID in environment variables
- **Solution**: Double-check your App ID in Pinterest Developer Console

#### 2. "Access Token Expired" Error
- **Cause**: Pinterest access tokens expire after 30 days
- **Solution**: Regenerate access token or implement refresh token flow

#### 3. "Insufficient Permissions" Error
- **Cause**: Missing required scopes
- **Solution**: Ensure your app has `boards:read`, `pins:read`, and `user_accounts:read` scopes

#### 4. "Rate Limit Exceeded" Error
- **Cause**: Too many API requests
- **Solution**: Implement rate limiting and caching

#### 5. CORS Issues
- **Cause**: Browser blocks cross-origin requests
- **Solution**: Implement server-side proxy or use Pinterest API from backend

### Debug Commands
```bash
# Check environment variables
echo $VITE_PINTEREST_APP_ID
echo $VITE_PINTEREST_ACCESS_TOKEN

# Test API connectivity
curl -H "Authorization: Bearer $VITE_PINTEREST_ACCESS_TOKEN" \
     https://api.pinterest.com/v5/user_account

# Test search functionality
curl -H "Authorization: Bearer $VITE_PINTEREST_ACCESS_TOKEN" \
     "https://api.pinterest.com/v5/search/pins?query=wedding%20decor&limit=5"
```

## Next Steps

After setting up Pinterest API:
1. Configure Google Vision API (see `GOOGLE_VISION_SETUP_GUIDE.md`)
2. Test the complete Pinterest-AI integration
3. Run the comprehensive system tests
4. Deploy to production environment

## Support Resources

- [Pinterest API Documentation](https://developers.pinterest.com/docs/api/v5/)
- [Pinterest API Explorer](https://developers.pinterest.com/tools/api-explorer/)
- [Pinterest Developer Community](https://help.pinterest.com/en/developers)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)

## Security Notes

⚠️ **Important Security Considerations**:
- Never commit API keys to version control
- Use environment variables for all credentials
- Implement proper token refresh mechanisms
- Monitor API usage for unusual activity
- Use HTTPS for all API communications
- Validate all user inputs before API calls