import { Role } from '../enums/role.enum';

export interface User {
  id?: string;
  email: string;
  password?: string; // Hashed password
  role: Role;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
