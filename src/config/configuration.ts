export default () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  environment: process.env.NODE_ENV || 'production',
  firebase: {
    serviceAccountPath:
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json',
    projectId: process.env.FIREBASE_PROJECT_ID || 'backend-27401',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret123',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || '587',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD, // App password for Gmail
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },
});
