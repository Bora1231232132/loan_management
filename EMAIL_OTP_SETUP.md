# Email OTP Setup Guide

## Overview

The authentication system now uses **Email OTP** instead of Firebase Phone Authentication. This is completely free and doesn't require billing.

## Setup Instructions

### 1. Configure Email Settings

Add these environment variables to your `.env` file or set them in your system:

```env
# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 2. Gmail Setup (Recommended)

If using Gmail, you need to create an **App Password**:

1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** → **2-Step Verification** (enable if not already)
3. Click **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Enter "NestJS OTP" as the name
6. Click **Generate**
7. Copy the 16-character password
8. Use this password as `EMAIL_PASSWORD` (not your regular Gmail password)

### 3. Other Email Providers

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**SendGrid (Free tier: 100 emails/day):**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

**Custom SMTP:**
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

## Testing

1. **Start the server:**
   ```bash
   npm run start:dev
   ```

2. **Open test page:**
   - Open `test-auth-email.html` in your browser
   - Enter your email address
   - Click "Send OTP"
   - Check your email inbox for the OTP code
   - Enter the OTP and click "Verify OTP"
   - You'll receive a JWT token

## API Endpoints

### Send OTP
```bash
POST http://localhost:3001/api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Verify OTP
```bash
POST http://localhost:3001/api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Sign Out (Protected)
```bash
POST http://localhost:3001/api/auth/sign-out
Authorization: Bearer YOUR_JWT_TOKEN
```

## Features

- ✅ **Completely Free** - No billing required
- ✅ **6-digit OTP** - Secure random codes
- ✅ **10-minute expiry** - OTPs expire after 10 minutes
- ✅ **In-memory storage** - Fast and simple
- ✅ **Email templates** - Professional HTML emails
- ✅ **JWT tokens** - Secure authentication

## OTP Details

- **Length:** 6 digits
- **Expiry:** 10 minutes
- **Format:** Numeric only (e.g., 123456)
- **Storage:** In-memory (cleared after verification or expiry)

## Troubleshooting

### "Failed to send OTP"
- Check email credentials in `.env`
- For Gmail: Make sure you're using an App Password, not your regular password
- Check firewall/network settings
- Verify SMTP server and port

### "Invalid or expired OTP"
- OTP expires after 10 minutes
- Make sure you're using the latest OTP sent
- Check email for the correct code

### Gmail "Less secure app" error
- Use App Passwords instead of regular password
- Enable 2-Step Verification first

## Security Notes

- OTPs are stored in-memory (cleared on server restart)
- OTPs expire after 10 minutes
- OTPs are deleted after successful verification
- Consider using Redis for production (persistent storage)

