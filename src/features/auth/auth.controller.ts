import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-otp') // sign up - first time only
  async sendOTP(@Body() sendOtpDto: SendOtpDto): Promise<{ message: string }> {
    return this.authService.sendOTP(sendOtpDto.email, sendOtpDto.password);
  }

  @Post('verify-otp') // sign up - verify OTP and create account
  async verifyOTP(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<AuthResponseDto> {
    return this.authService.verifyOTP(
      verifyOtpDto.email,
      verifyOtpDto.otp,
      verifyOtpDto.password,
    );
  }

  @Post('sign-in') // sign in - for existing users (email + password only)
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return await this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('sign-out') // sign out
  @UseGuards(JwtAuthGuard)
  async signOut(@Request() req): Promise<{ message: string }> {
    const user = req.user as User; // User from JWT strategy
    return await this.authService.signOut(user.id!, user.email);
  }
}
