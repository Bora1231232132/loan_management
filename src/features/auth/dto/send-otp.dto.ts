import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Role } from '../enums/role.enum';
import { Transform } from 'class-transformer';

export class SendOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsIn([Role.USER, Role.ADMIN], {
    message: 'Role must be either client (user) or admin',
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return Role.USER;
    }
    return value;
  })
  role?: Role = Role.USER;
}
