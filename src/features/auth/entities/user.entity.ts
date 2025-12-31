export interface User {
  id?: string;
  email: string;
  password?: string; // Hashed password
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
