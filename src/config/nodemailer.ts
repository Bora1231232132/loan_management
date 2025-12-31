import * as nodemailer from 'nodemailer';
import {
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_FROM,
} from './env';

const port = parseInt(EMAIL_PORT || '587', 10);
const secure = port === 465; // true for 465, false for other ports (587, etc.)

export const transporter = nodemailer.createTransport({
  host: EMAIL_HOST || 'smtp.gmail.com',
  port,
  secure, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
  debug: true, // Enable debug output
  logger: true, // Log to console
});

// Export email configuration
export const emailConfig = {
  from: EMAIL_FROM || EMAIL_USER,
  user: EMAIL_USER,
};

// Verify transporter connection
transporter.verify((error) => {
  if (error) {
    console.error('❌ Nodemailer connection error:');
    console.error('Full error:', error);
  } else {
    console.log('✅ Nodemailer is ready to send emails');
    console.log('From:', emailConfig.from || emailConfig.user);
    console.log('Host:', EMAIL_HOST || 'smtp.gmail.com');
    console.log('Port:', port, secure ? '(secure)' : '(TLS)');
  }
});
