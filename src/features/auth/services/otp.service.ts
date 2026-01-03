import { Injectable } from '@nestjs/common';
import { Role } from '../enums/role.enum';

interface OtpData {
  otp: string;
  email: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  private otpStore: Map<string, OtpData> = new Map();
  private passwordStore: Map<string, string> = new Map(); // Store password hashes temporarily
  private roleStore: Map<string, Role> = new Map(); // Store roles temporarily
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_LENGTH = 6;

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeOTP(email: string, otp: string): void {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    this.otpStore.set(email, {
      otp,
      email,
      expiresAt,
    });

    // Clean up expired OTPs
    this.cleanupExpiredOTPs();
  }

  verifyOTP(email: string, otp: string): boolean {
    const otpData = this.otpStore.get(email);

    if (!otpData) {
      return false;
    }

    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(email);
      this.passwordStore.delete(email); // Also clear password if OTP expired
      this.roleStore.delete(email); // Also clear role if OTP expired
      return false;
    }

    if (otpData.otp !== otp) {
      return false;
    }

    // Remove OTP after successful verification (but keep password until user is created)
    this.otpStore.delete(email);
    return true;
  }

  storePassword(email: string, passwordHash: string): void {
    this.passwordStore.set(email, passwordHash);
  }

  getPassword(email: string): string | undefined {
    return this.passwordStore.get(email);
  }

  clearPassword(email: string): void {
    this.passwordStore.delete(email);
  }

  storeRole(email: string, role: Role): void {
    this.roleStore.set(email, role);
  }

  getRole(email: string): Role | undefined {
    return this.roleStore.get(email);
  }

  clearRole(email: string): void {
    this.roleStore.delete(email);
  }

  private cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [email, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(email);
      }
    }
  }
}
