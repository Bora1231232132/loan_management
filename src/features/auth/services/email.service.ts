import { Injectable } from '@nestjs/common';
import { transporter, emailConfig } from '../../../config/nodemailer';

@Injectable()
export class EmailService {
  constructor() {
    // Use the shared transporter from nodemailer.ts
    // Connection verification is handled in nodemailer.ts
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    if (!emailConfig.user || !emailConfig.from) {
      throw new Error(
        'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.',
      );
    }

    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  }
}
