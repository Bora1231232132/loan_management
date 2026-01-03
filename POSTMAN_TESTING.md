# Postman Testing Guide

## Base URL
```
http://localhost:3001/api
```

## Import Collection
Import `postman-collection.json` into Postman, or use the examples below.

---

## Authentication Endpoints

### 1. Send OTP (Sign Up - First Step)

**Endpoint:** `POST /api/auth/send-otp`

**Description:** Sends a 6-digit OTP code to the user's email. This is the first step in the sign-up process.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Example Request:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent successfully to your email"
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

**Error Response (400 - User exists):**
```json
{
  "statusCode": 400,
  "message": "User with this email already exists",
  "error": "Bad Request"
}
```

---

### 2. Verify OTP (Sign Up - Complete Registration)

**Endpoint:** `POST /api/auth/verify-otp`

**Description:** Verifies the OTP code and creates a new user account. This completes the sign-up process.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "your-email@example.com",
  "otp": "123456",
  "password": "your-password"
}
```

**Example Request:**
```json
{
  "email": "test@example.com",
  "otp": "123456",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "firestore-document-id",
    "email": "test@example.com",
    "role": "user"
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

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "User already exists. Please use sign-in endpoint instead.",
  "error": "Bad Request"
}
```

---

### 3. Sign In (Existing Users)

**Endpoint:** `POST /api/auth/sign-in`

**Description:** Authenticates existing users with email and password. Returns a JWT token.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Example Request:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "firestore-document-id",
    "email": "test@example.com",
    "role": "user"
  },
  "message": "User signed in successfully"
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

**Error Response (401 - User not found):**
```json
{
  "statusCode": 401,
  "message": "User not found. Please sign up first.",
  "error": "Unauthorized"
}
```

---

### 4. Sign Out

**Endpoint:** `POST /api/auth/sign-out`

**Description:** Signs out the authenticated user. Requires a valid JWT token.

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

## Role-Based Access Control Endpoints

### 5. Admin Test Endpoint

**Endpoint:** `GET /api/auth/admin/test`

**Description:** Example endpoint that requires ADMIN role. Demonstrates role-based access control.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** None

**Success Response (200) - Admin User:**
```json
{
  "message": "Admin access granted",
  "user": {
    "id": "firestore-document-id",
    "email": "admin@example.com",
    "role": "admin",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (403) - Non-Admin User:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Error Response (401) - No Token:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### 6. Manager Test Endpoint

**Endpoint:** `GET /api/auth/manager/test`

**Description:** Example endpoint that requires ADMIN or MANAGER role. Demonstrates multiple role access.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:** None

**Success Response (200) - Admin or Manager User:**
```json
{
  "message": "Manager or Admin access granted",
  "user": {
    "id": "firestore-document-id",
    "email": "manager@example.com",
    "role": "manager",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (403) - Regular User:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Testing Flow

### Complete Sign-Up Flow

1. **Send OTP**
   - Use `POST /api/auth/send-otp`
   - Provide email and password
   - Check your email inbox for the 6-digit OTP code

2. **Verify OTP**
   - Use `POST /api/auth/verify-otp`
   - Provide email, OTP code, and password
   - Copy the `accessToken` from the response
   - User is created with default role: `user`

### Sign-In Flow (Existing Users)

1. **Sign In**
   - Use `POST /api/auth/sign-in`
   - Provide email and password
   - Copy the `accessToken` from the response

### Testing Role-Based Access

1. **Get JWT Token**
   - Sign up or sign in to get an `accessToken`

2. **Test Admin Endpoint**
   - Use `GET /api/auth/admin/test`
   - Add `Authorization: Bearer YOUR_JWT_TOKEN` header
   - **Note:** This will only work if your user has `admin` role

3. **Test Manager Endpoint**
   - Use `GET /api/auth/manager/test`
   - Add `Authorization: Bearer YOUR_JWT_TOKEN` header
   - **Note:** This will work if your user has `admin` or `manager` role

4. **Test Sign Out**
   - Use `POST /api/auth/sign-out`
   - Add `Authorization: Bearer YOUR_JWT_TOKEN` header

---

## Postman Environment Variables

Set these variables in Postman:

| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3001/api` | API base URL |
| `accessToken` | (leave empty) | Will be set after verify-otp or sign-in |
| `userEmail` | `test@example.com` | Test user email |
| `userPassword` | `password123` | Test user password |

### Setting Variables Automatically

You can use Postman's "Tests" tab to automatically set the `accessToken` variable:

**For verify-otp and sign-in endpoints:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.accessToken);
}
```

---

## Quick Copy-Paste JSON

### Send OTP (Sign Up):
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### Verify OTP (Complete Sign Up):
```json
{
  "email": "test@example.com",
  "otp": "123456",
  "password": "password123"
}
```

### Sign In:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

---

## User Roles

The system supports the following roles:

- **`user`** - Default role assigned to all new users
- **`admin`** - Administrative access
- **`manager`** - Managerial access

### Default Role Assignment

- New users are automatically assigned the `user` role
- Existing users without a role default to `user` role
- To change a user's role, update it in Firestore and have the user sign in again

---

## Important Notes

### Authentication
- OTP expires in **10 minutes**
- OTP is **6 digits** (numeric only)
- Password must be at least **6 characters** long
- JWT token is valid for **7 days** (default, configurable via `JWT_EXPIRES_IN`)

### Role-Based Access
- Always use `JwtAuthGuard` before `RolesGuard` (handled automatically)
- Users need to sign in again after role changes to get a new JWT token
- Role is included in the JWT token payload
- Role is returned in all authentication responses

### Security
- Never share your JWT token
- Store tokens securely
- Use HTTPS in production
- Tokens are included in the `Authorization` header as: `Bearer YOUR_TOKEN`

---

## Testing Scenarios

### Scenario 1: New User Sign-Up
1. Send OTP with new email
2. Check email for OTP
3. Verify OTP to create account
4. User gets `user` role by default

### Scenario 2: Existing User Sign-In
1. Sign in with email and password
2. Receive JWT token
3. Use token for protected endpoints

### Scenario 3: Role-Based Access Test
1. Sign in as regular user (`user` role)
2. Try to access `/api/auth/admin/test` → Should get 403 Forbidden
3. Try to access `/api/auth/manager/test` → Should get 403 Forbidden
4. (If you have admin/manager account) Sign in with that account
5. Access admin/manager endpoints → Should get 200 OK

### Scenario 4: Invalid Token
1. Use expired or invalid token
2. Access protected endpoint
3. Should get 401 Unauthorized

---

## Troubleshooting

### Issue: "User with this email already exists"
- **Solution:** Use the sign-in endpoint instead of send-otp

### Issue: "Invalid or expired OTP"
- **Solution:** Request a new OTP (OTP expires in 10 minutes)

### Issue: "Forbidden resource" (403)
- **Solution:** Your user doesn't have the required role. Update user role in Firestore or use an account with the correct role.

### Issue: "Unauthorized" (401)
- **Solution:** Check that your JWT token is valid and not expired. Sign in again to get a new token.

### Issue: Token not working after role change
- **Solution:** Sign in again to get a new JWT token with the updated role.
