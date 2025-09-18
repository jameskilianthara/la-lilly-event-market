# 🎨 Leonardo AI Setup Guide

## 📋 Quick Setup Checklist

- [ ] Create Leonardo AI account
- [ ] Get API key
- [ ] Add to environment variables
- [ ] Test with provided script
- [ ] Deploy to production

## 🚀 Step-by-Step Setup

### **Step 1: Create Account (5 minutes)**

1. **Visit Leonardo AI**:
   ```
   https://leonardo.ai
   ```

2. **Sign Up**:
   - Click "Get Started" or "Sign Up"
   - Use Google, Discord, or Email
   - Complete email verification

3. **Free Credits**:
   - New accounts get 150 daily tokens FREE
   - Perfect for testing and initial usage
   - No credit card required

### **Step 2: Get API Access (5 minutes)**

1. **Navigate to API**:
   - After signing in, look for "API" in the menu
   - Or go to: `https://docs.leonardo.ai/reference`

2. **Generate API Key**:
   - Go to your profile/account settings
   - Find "API Keys" or "Developer" section
   - Click "Generate New API Key"
   - **COPY THE KEY IMMEDIATELY** (you can't see it again)

3. **Save Your Key**:
   ```
   Example: leo_sk_1234567890abcdef...
   ```

### **Step 3: Add to Your Environment (2 minutes)**

1. **Create/Update .env file**:
   ```bash
   cd /Users/jameskilianthara/Desktop/event-marketplace/server
   
   # If .env doesn't exist, copy from example
   cp .env.example .env
   ```

2. **Add Leonardo API Key**:
   ```bash
   # Edit your .env file
   nano .env
   
   # Add this line with your actual API key:
   LEONARDO_API_KEY=leo_sk_your_actual_api_key_here
   RENDERING_SERVICE=leonardo
   ```

3. **Save and close** the file

### **Step 4: Test the Setup (3 minutes)**

1. **Install dependencies** (if not already done):
   ```bash
   cd /Users/jameskilianthara/Desktop/event-marketplace/server
   npm install node-fetch dotenv
   ```

2. **Run the test script**:
   ```bash
   node test-leonardo.js
   ```

3. **Expected output**:
   ```
   🧪 Testing Leonardo AI API...
   🔑 API Key: leo_sk_123...
   
   1️⃣ Testing user info...
   ✅ User info retrieved successfully
   👤 User ID: 12345
   💰 Token balance: 150
   
   2️⃣ Testing image generation...
   ✅ Image generation started successfully
   🎨 Generation ID: gen_abc123
   
   🎉 Image generated successfully!
   🖼️  Image URL: https://cdn.leonardo.ai/...
   💰 Cost: ~$0.001 (₹0.08)
   
   ✅ Leonardo AI setup is working perfectly!
   🚀 Your system is ready to generate professional event images!
   ```

### **Step 5: Start Your Server (1 minute)**

1. **Start the development server**:
   ```bash
   cd /Users/jameskilianthara/Desktop/event-marketplace/server
   npm run dev
   # or
   node server-dev.js
   ```

2. **Test the API endpoint**:
   ```bash
   curl -X POST http://localhost:5001/api/ai-visuals/generate \
     -H "Content-Type: application/json" \
     -d '{
       "requirements": {
         "eventType": "wedding",
         "theme": "elegant",
         "colors": ["gold", "red"]
       },
       "options": {
         "service": "leonardo",
         "variations": 2
       }
     }'
   ```

## 💰 Cost Breakdown

### **Leonardo AI Pricing**
- **Free Tier**: 150 tokens daily (150 images)
- **Paid Plans**: 
  - Apprentice: $10/month (8,500 tokens)
  - Artisan: $24/month (25,000 tokens)
  - Maestro: $48/month (60,000 tokens)

### **Cost Per Image**
```
Leonardo Cost: $0.001 per image (₹0.08)
Your Vendor Price: ₹50 per image
Your Profit: ₹49.92 per image (99.8% margin!)

Daily Potential (50 images):
Revenue: ₹2,500
Cost: ₹4
Profit: ₹2,496
```

## 🎯 API Configuration Details

### **Model Settings** (Already configured in your system)
```javascript
{
  modelId: "aa77f04e-3eec-4034-9c07-d0f619684628", // Leonardo Creative
  width: 1024,
  height: 1024,
  guidance_scale: 7,
  sd_version: "v2",
  presetStyle: "DYNAMIC"
}
```

### **Available Models**
- **Leonardo Creative**: Best for events (default)
- **Leonardo Select**: Premium model (+20% cost)
- **Leonardo Diffusion**: Artistic style
- **SDXL**: Ultra-high quality (+50% cost)

## 🔧 Troubleshooting

### **Common Issues & Solutions**

1. **"API Key Invalid"**:
   - Double-check your API key in .env
   - Ensure no extra spaces or characters
   - Regenerate key if needed

2. **"Insufficient Credits"**:
   - Check your Leonardo dashboard
   - Free accounts get 150 daily tokens
   - Upgrade plan if needed for higher volume

3. **"Generation Timeout"**:
   - Leonardo can take 10-60 seconds
   - Our system waits up to 2.5 minutes
   - Try again if it fails

4. **"Image Not Found"**:
   - Check your uploads/renders/ directory exists
   - Verify file permissions
   - Ensure server has write access

### **Support Resources**
- Leonardo AI Documentation: https://docs.leonardo.ai
- Community Discord: Available in Leonardo dashboard
- API Status: Check Leonardo AI status page

## 🚀 Production Deployment

### **Environment Variables for Production**
```bash
# Production .env
RENDERING_SERVICE=leonardo
LEONARDO_API_KEY=your_production_api_key
NODE_ENV=production

# Optional: Add backup services
STABILITY_API_KEY=your_dreamstudio_key
OPENAI_API_KEY=your_openai_key
```

### **Scaling Considerations**
- **Rate Limits**: 10 requests/second
- **Monthly Limits**: Based on your plan
- **Backup Services**: DreamStudio, DALL-E as fallbacks
- **Load Balancing**: Multiple API keys for high volume

## 🎉 You're Ready!

Once you complete these steps, you'll have:

✅ **Ultra-affordable image generation** at ₹0.08 per image  
✅ **99.8% profit margins** when charging vendors ₹50  
✅ **Professional event visuals** in 10-30 seconds  
✅ **Scalable API integration** ready for production  
✅ **Competitive advantage** over expensive alternatives  

**Start generating professional event images at 2,500x less cost than Neo!** 🎨💰