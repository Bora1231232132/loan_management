import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../database/database.service';
import { User } from './entities/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private database: DatabaseService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    private otpService: OtpService,
  ) {}

  async sendOTP(email: string, password: string): Promise<{ message: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate OTP
      const otp = this.otpService.generateOTP();

      // Store OTP and password hash temporarily
      this.otpService.storeOTP(email, otp);
      this.otpService.storePassword(email, hashedPassword);

      // Send OTP via email
      await this.emailService.sendOTP(email, otp);

      return { message: 'OTP sent successfully to your email' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send OTP');
    }
  }

  async verifyOTP(
    email: string,
    otp: string,
    password: string,
  ): Promise<AuthResponseDto> {
    try {
      // Verify OTP
      const isValid = this.otpService.verifyOTP(email, otp);

      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      // Check if user already exists (should not exist for first sign-up)
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new BadRequestException(
          'User already exists. Please use sign-in endpoint instead.',
        );
      }

      // Get stored password hash (from sign-up)
      const storedPasswordHash = this.otpService.getPassword(email);
      if (!storedPasswordHash) {
        throw new UnauthorizedException(
          'Password not found. Please try signing up again.',
        );
      }

      // Create new user in Firestore with password
      const user = await this.createOrUpdateUser(email, storedPasswordHash);

      // Clear temporary password store after use
      this.otpService.clearPassword(email);

      console.log('✅ New user created in Firestore:', {
        userId: user.id,
        email: user.email,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
      });

      // Log sign-up activity (wrap in try-catch to not fail the whole request)
      try {
        await this.logAuthActivity(user.id!, email, 'sign-up');
      } catch (logError) {
        console.error(
          '⚠️ Failed to log sign-up activity (non-critical):',
          logError,
        );
        // Continue even if logging fails
      }

      // Generate JWT token
      const accessToken = this.generateJwt(user.id!, email);

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('❌ Error in verifyOTP:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponseDto> {
    try {
      // Get user from Firestore
      const user = await this.getUserByEmail(email);

      if (!user) {
        throw new UnauthorizedException(
          'User not found. Please sign up first.',
        );
      }

      // Verify password
      if (!user.password) {
        throw new UnauthorizedException(
          'Password not set. Please reset your password.',
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Update last login time
      const updatedUser = await this.createOrUpdateUser(email);

      console.log('✅ User signed in:', {
        userId: updatedUser.id,
        email: updatedUser.email,
        lastLoginAt: updatedUser.lastLoginAt,
      });

      // Log sign-in activity (wrap in try-catch to not fail the whole request)
      try {
        await this.logAuthActivity(updatedUser.id!, email, 'sign-in');
      } catch (logError) {
        console.error(
          '⚠️ Failed to log sign-in activity (non-critical):',
          logError,
        );
        // Continue even if logging fails
      }

      // Generate JWT token
      const accessToken = this.generateJwt(updatedUser.id!, email);

      return {
        accessToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
        },
        message: 'User signed in successfully',
      };
    } catch (error) {
      console.error('❌ Error in signIn:', error);
      throw error;
    }
  }

  async createOrUpdateUser(
    email: string,
    passwordHash?: string,
  ): Promise<User> {
    const db = this.database.getDb();
    const usersRef = db.collection('users');

    // Check if user exists
    const existingUserQuery = await usersRef
      .where('email', '==', email)
      .limit(1)
      .get();

    const now = new Date();

    if (!existingUserQuery.empty) {
      // Update existing user
      const userDoc = existingUserQuery.docs[0];
      const userData: any = {
        isVerified: true,
        updatedAt: now,
        lastLoginAt: now,
      };

      // Update password if provided (password reset scenario)
      if (passwordHash) {
        userData.password = passwordHash;
      }

      await userDoc.ref.update(userData);

      const updatedUser = {
        id: userDoc.id,
        ...userDoc.data(),
        ...userData,
      } as User;

      console.log('🔄 Updated existing user in Firestore:', {
        userId: updatedUser.id,
        email: updatedUser.email,
      });

      return updatedUser;
    } else {
      // Create new user
      const userData: Omit<User, 'id'> = {
        email,
        password: passwordHash, // Store hashed password
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      const docRef = await usersRef.add(userData);

      const newUser = {
        id: docRef.id,
        ...userData,
      };

      console.log('✨ Created new user in Firestore:', {
        userId: newUser.id,
        email: newUser.email,
      });

      return newUser;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = this.database.getDb();
    const usersRef = db.collection('users');

    const query = await usersRef.where('email', '==', email).limit(1).get();

    if (query.empty) {
      return null;
    }

    const doc = query.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as User;
  }

  generateJwt(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
    };

    return this.jwtService.sign(payload);
  }

  async signOut(userId: string, email: string): Promise<{ message: string }> {
    // Log sign-out activity
    await this.logAuthActivity(userId, email, 'sign-out');

    return { message: 'Signed out successfully' };
  }

  private extractUsername(email: string): string {
    // Extract username from email (part before @)
    return email.split('@')[0];
  }

  private async logAuthActivity(
    userId: string,
    email: string,
    type: 'sign-up' | 'sign-in' | 'sign-out',
  ): Promise<void> {
    const db = this.database.getDb();
    const usersRef = db.collection('users');
    const username = this.extractUsername(email);

    let documentId: string;
    let sequenceNumber: number | undefined;

    if (type === 'sign-up') {
      // Sign-up: format is "sign-up-username" (no number)
      documentId = `sign-up-${username}`;
    } else {
      // Sign-in or sign-out: format is "sign-in-username-1" or "sign-out-username-1"
      sequenceNumber = await this.getNextSequenceNumber(
        usersRef,
        type,
        username,
      );
      documentId = `${type}-${username}-${sequenceNumber}`;
    }

    // Create activity log document
    const activityData: any = {
      type, // 'sign-up', 'sign-in', or 'sign-out'
      userId,
      email,
      username,
      timestamp: new Date(),
      documentId,
    };

    // Add sequence number only for sign-in and sign-out
    if (sequenceNumber !== undefined) {
      activityData.sequenceNumber = sequenceNumber;
    }

    // Store as separate document with custom ID
    await usersRef.doc(documentId).set(activityData);

    console.log(`📝 Logged ${type} activity:`, {
      documentId,
      userId,
      email,
      username,
      sequenceNumber,
    });
  }

  private async getNextSequenceNumber(
    collectionRef: admin.firestore.CollectionReference,
    type: 'sign-in' | 'sign-out',
    username: string,
  ): Promise<number> {
    try {
      // Get all documents of this type for this specific username
      const query = await collectionRef
        .where('type', '==', type)
        .where('username', '==', username)
        .get();

      if (query.empty) {
        // First document of this type for this username
        return 1;
      }

      // Find the maximum sequence number for this username
      let maxSequence = 0;
      query.docs.forEach((doc) => {
        const data = doc.data();
        const seq = (data?.sequenceNumber as number) || 0;
        if (seq > maxSequence) {
          maxSequence = seq;
        }
      });

      return maxSequence + 1;
    } catch (error) {
      console.error('Error getting next sequence number:', error);
      // Fallback: use timestamp-based number if query fails
      return Date.now();
    }
  }
}
