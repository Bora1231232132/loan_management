# Authentication Testing Guide

This guide explains how to test the Firebase Phone Authentication system.

## Prerequisites

1. **Start the NestJS server:**

   ```bash
   npm run start:dev
   ```

   Server runs on `http://localhost:3001`

2. **Firebase Project Setup:**
   - You need a Firebase project with Phone Authentication enabled
   - Get your Firebase config from Firebase Console → Project Settings → General → Your apps

   **How to get Firebase Config:**
   1. Go to [Firebase Console](https://console.firebase.google.com)
   2. Select your project (or create a new one)
   3. Click the gear icon ⚙️ → **Project Settings**
   4. Scroll down to **Your apps** section
   5. If you don't have a web app, click **Add app** → **Web** (</> icon)
   6. Copy the config object that looks like this:

   ```json
   {
     "apiKey": "AIzaSy...",
     "authDomain": "your-project.firebaseapp.com",
     "projectId": "your-project-id",
     "storageBucket": "your-project.appspot.com",
     "messagingSenderId": "123456789",
     "appId": "1:123456789:web:abc123"
   }
   ```

   7. **Enable Phone Authentication (REQUIRED - This fixes CONFIGURATION_NOT_FOUND error):**
      - Go to **Authentication** → **Sign-in method** tab
      - Find **Phone** in the list
      - Click on **Phone** (or click the pencil icon)
      - Toggle **Enable** to ON
      - Click **Save**
      - Wait a few seconds for the configuration to propagate
   8. **Enable Billing (REQUIRED for Phone Authentication - fixes BILLING_NOT_ENABLED error):**
      - Phone Authentication requires billing because SMS messages cost money
      - Go to [Firebase Console](https://console.firebase.google.com) → Your project
      - Click **Upgrade** in the top bar, OR go to **Project Settings** → **Usage and billing**
      - Click **Modify plan** or **Upgrade project**
      - Select **Blaze Plan** (Pay as you go) - **This is required for Phone Auth**
      - Add a payment method (credit card)
      - **Note:** Firebase has a free tier - you won't be charged unless you exceed free limits
      - Free tier includes: 10,000 phone verifications/month (US/Canada), 1,000/month (other countries)
      - Wait a few minutes for billing to activate

   9. **Enable Identity Toolkit API (if still getting errors):**
      - Go to [Google Cloud Console](https://console.cloud.google.com)
      - Select your Firebase project (`backend-27401`)
      - Go to **APIs & Services** → **Library**
      - Search for "Identity Toolkit API"
      - Click on it and click **Enable**
      - Wait 1-2 minutes for it to activate

## Testing Methods

### Method 1: Using the HTML Test Page (Easiest)

1. Open `test-auth.html` in a browser
2. Enter your Firebase config (JSON format):
   - **Quick option**: Copy the contents from `firebase-config.json` in the project root
   - **Or manually enter**:
   ```json
   {
     "apiKey": "AIzaSyCquC1yXsEfWQY_By56DqyhHvi3tvOyzcU",
     "authDomain": "backend-27401.firebaseapp.com",
     "projectId": "backend-27401",
     "storageBucket": "backend-27401.firebasestorage.app",
     "messagingSenderId": "304870522088",
     "appId": "1:304870522088:web:b99bbf37869c16075f5d5d",
     "measurementId": "G-QK909G4Q90"
   }
   ```
3. Click "Initialize Firebase"
4. Enter phone number (E.164 format: +1234567890)
5. Click "Send OTP" - you'll receive SMS
6. Enter OTP code
7. Click "Verify OTP" - gets Firebase ID token
8. Click "Verify Token with Backend" - gets JWT from backend
9. Click "Test Sign Out" - tests protected endpoint

### Method 2: Using cURL/Postman

#### Step 1: Get Firebase ID Token (Client-side required)

You need to get a Firebase ID token first. Use the HTML test page or a mobile app with Firebase Auth SDK.

#### Step 2: Verify Token with Backend

**cURL:**

```bash
curl -X POST http://localhost:3001/api/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_FIREBASE_ID_TOKEN_HERE"}'
```

**Postman:**

- Method: `POST`
- URL: `http://localhost:3001/api/auth/verify-token`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "idToken": "YOUR_FIREBASE_ID_TOKEN_HERE"
  }
  ```

**Expected Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "phoneNumber": "+1234567890",
    "firebaseUid": "firebase-uid-here"
  }
}
```

#### Step 3: Test Sign Out (Protected Endpoint)

**cURL:**

```bash
curl -X POST http://localhost:3001/api/auth/sign-out \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Postman:**

- Method: `POST`
- URL: `http://localhost:3001/api/auth/sign-out`
- Headers:
  - `Authorization: Bearer YOUR_JWT_TOKEN_HERE`
  - `Content-Type: application/json`

**Expected Response:**

```json
{
  "message": "Signed out successfully"
}
```

### Method 3: Using a Test Script

Create a Node.js script to test (requires Firebase Admin SDK or a real Firebase ID token):

```javascript
// test-auth.js
const fetch = require('node-fetch');

async function testAuth() {
  // Replace with actual Firebase ID token
  const firebaseIdToken = 'YOUR_FIREBASE_ID_TOKEN';

  // Test verify-token endpoint
  const verifyResponse = await fetch(
    'http://localhost:3001/api/auth/verify-token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: firebaseIdToken }),
    },
  );

  const verifyData = await verifyResponse.json();
  console.log('Verify Token Response:', verifyData);

  if (verifyData.accessToken) {
    // Test sign-out endpoint
    const signOutResponse = await fetch(
      'http://localhost:3001/api/auth/sign-out',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${verifyData.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const signOutData = await signOutResponse.json();
    console.log('Sign Out Response:', signOutData);
  }
}

testAuth().catch(console.error);
```

## Testing Protected Routes

To test that JWT authentication works, you can create a test protected endpoint:

```typescript
// In any controller
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Get('protected')
@UseGuards(JwtAuthGuard)
getProtected() {
  return { message: 'This is a protected route' };
}
```

Then test with:

```bash
curl -X GET http://localhost:3001/api/your-route/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Issues

1. **"Invalid Firebase token" error:**
   - Make sure Firebase ID token is valid and not expired
   - Check Firebase project configuration

2. **"Phone number not found in token":**
   - Ensure user authenticated with phone number
   - Token must come from Firebase Auth phone authentication

3. **"User not found" error:**
   - User should be created automatically on first verify-token call
   - Check Firestore `users` collection

4. **"BILLING_NOT_ENABLED" error:**
   - Phone Authentication requires billing to be enabled
   - Go to Firebase Console → Project Settings → Usage and billing
   - Upgrade to **Blaze Plan** (Pay as you go)
   - Add a payment method
   - **Note:** Free tier includes 10,000 verifications/month (US/Canada)

5. **CORS errors (if testing from browser):**
   - Add CORS configuration in `main.ts`:
     ```typescript
     app.enableCors();
     ```

## Verifying in Firestore

After successful authentication, check Firestore:

- Collection: `users`
- Documents should contain:
  - `firebaseUid`: Firebase user UID
  - `phoneNumber`: Phone number
  - `isVerified`: true
  - `createdAt`, `updatedAt`, `lastLoginAt`: Timestamps

## Environment Variables

Make sure these are set (or use defaults):

```
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```
