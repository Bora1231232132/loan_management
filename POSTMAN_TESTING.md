# Postman Testing Guide

## Base URL
```
http://localhost:3001/api
```

## Import Collection
Import `postman-collection.json` into Postman, or use the examples below.

---

## 1. Send OTP (Sign Up)

**Endpoint:** `POST /api/auth/send-otp`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "your-email@example.com"
}
```

**Example Request:**
```json
{
  "email": "test@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent successfully to your email"
}
```

**Error Response (400/500):**
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

---

## 2. Verify OTP (Sign In)

**Endpoint:** `POST /api/auth/verify-otp`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "your-email@example.com",
  "otp": "123456"
}
```

**Example Request:**
```json
{
  "email": "test@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "firestore-document-id",
    "email": "test@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired OTP",
  "error": "Unauthorized"
}
```

---

## 3. Sign Out

**Endpoint:** `POST /api/auth/sign-out`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** None (empty)

**Success Response (200):**
```json
{
  "message": "Signed out successfully"
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Testing Flow

### Step 1: Send OTP
1. Use **Send OTP** endpoint
2. Enter your email address
3. Check your email inbox for the 6-digit OTP code

### Step 2: Verify OTP
1. Use **Verify OTP** endpoint
2. Enter the same email and the OTP code from your email
3. Copy the `accessToken` from the response
4. User data is automatically stored in Firestore

### Step 3: Sign Out (Optional)
1. Use **Sign Out** endpoint
2. Add `Authorization: Bearer YOUR_JWT_TOKEN` header
3. Use the token from Step 2

---

## Postman Environment Variables

Set these variables in Postman:

| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3001/api` | API base URL |
| `accessToken` | (leave empty) | Will be set after verify-otp |

---

## Quick Copy-Paste JSON

### Send OTP:
```json
{
  "email": "test@example.com"
}
```

### Verify OTP:
```json
{
  "email": "test@example.com",
  "otp": "123456"
}
```

---

## Notes

- OTP expires in **10 minutes**
- OTP is **6 digits** (numeric only)
- User is created/updated in Firestore on successful verification
- JWT token is valid for **7 days** (default, configurable via `JWT_EXPIRES_IN`)

