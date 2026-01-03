import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from 'src/database/database.service';
import { User } from '../entities/user.entity';
import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private database: DatabaseService,
  ) {
    const secret = config.get<string>('jwt.secret');

    if (!secret) {
      throw new Error('JWT secret is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const db = this.database.getDb();
    const usersRef = db.collection('users');

    const userDoc = await usersRef.doc(payload.sub).get();

    if (!userDoc.exists) {
      throw new UnauthorizedException('User not found');
    }

    const userData = userDoc.data();

    if (!userData) {
      throw new UnauthorizedException('User data not found');
    }

    return {
      id: userDoc.id,
      role: userData.role || Role.USER, // Default to USER for existing users
      ...userData,
    } as User;
  }
}
