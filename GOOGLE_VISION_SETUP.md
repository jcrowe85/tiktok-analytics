# Google Vision API Setup Guide

## Option 1: Service Account (Recommended)

### Step 1: Create Google Cloud Project
1. Go to: https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name: "TikTok Analytics" 
4. Click "Create"

### Step 2: Enable Vision API
1. Go to: https://console.cloud.google.com/apis/library/vision.googleapis.com
2. Click "Enable"
3. Wait for activation (~30 seconds)

### Step 3: Create Service Account
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click "Create Service Account"
3. Name: "tiktok-analytics-vision"
4. Click "Create and Continue"
5. Role: "Cloud Vision API User"
6. Click "Done"

### Step 4: Create & Download Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON"
5. Click "Create"
6. A JSON file will download automatically

### Step 5: Add to Project
1. Save the downloaded JSON file as: `google-vision-credentials.json`
2. Move it to your project root: `/Users/joshuacrowe/Desktop/web-projects/tiktok-analytics/`
3. Add to `.env`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./google-vision-credentials.json
   ```

### Step 6: Add to .gitignore
Make sure `google-vision-credentials.json` is in `.gitignore` (don't commit it!)

---

## Option 2: API Key (Simpler, Less Secure)

### Step 1: Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the API key

### Step 2: Add to .env
```bash
GOOGLE_VISION_API_KEY=your_api_key_here
```

⚠️ **Note:** API keys are less secure. Use Service Account for production.

---

## Pricing

**Google Vision API:**
- **First 1,000 requests/month**: FREE
- **After that**: $1.50 per 1,000 images

**For your 109 videos × 9 keyframes = 981 images/month**
- **Cost: $0** (within free tier!)

---

## Testing

After setup, test with:
```bash
npx tsx -e "
import { testVisionConnection } from './src/backend/ai/vision.ts';
testVisionConnection().then(success => {
  console.log('Google Vision:', success ? '✅ Working' : '❌ Failed');
});
"
```

