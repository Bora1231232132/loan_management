import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../database/database.service';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private database: DatabaseService) {}

  async getAllUsers(): Promise<User[]> {
    try {
      const db = this.database.getDb();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('role', '==', Role.USER).get();

      if (snapshot.empty) {
        return [];
      }

      const users: User[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData,
        } as User);
      });

      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const db = this.database.getDb();
      const userDoc = await db.collection('users').doc(id).get();

      if (!userDoc.exists) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const userData = userDoc.data();
      const user = {
        id: userDoc.id,
        ...userData,
      } as User;

      if (user.role !== Role.USER) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user by ID:', error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const db = this.database.getDb();
      const usersRef = db.collection('users');

      const existingUserQuery = await usersRef
        .where('email', '==', createUserDto.email)
        .limit(1)
        .get();

      if (!existingUserQuery.empty) {
        throw new BadRequestException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const now = new Date();

      const userData: Omit<User, 'id'> = {
        email: createUserDto.email,
        password: hashedPassword,
        role: Role.USER,
        isVerified: createUserDto.isVerified ?? true,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await usersRef.add(userData);

      const newUser: User = {
        id: docRef.id,
        ...userData,
      };

      console.log('✨ Created new user:', {
        userId: newUser.id,
        email: newUser.email,
      });

      return newUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const db = this.database.getDb();
      const userRef = db.collection('users').doc(id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const existingUserData = userDoc.data();
      const existingUser = {
        id: userDoc.id,
        ...existingUserData,
      } as User;

      if (existingUser.role !== Role.USER) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const updateData: Partial<User> = {
        updatedAt: new Date(),
      };

      if (updateUserDto.email !== undefined) {
        if (updateUserDto.email !== userDoc.data()?.email) {
          const existingUserQuery = await db
            .collection('users')
            .where('email', '==', updateUserDto.email)
            .limit(1)
            .get();

          if (!existingUserQuery.empty) {
            throw new BadRequestException(
              'User with this email already exists',
            );
          }
        }
        updateData.email = updateUserDto.email;
      }

      if (updateUserDto.password !== undefined) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      if (updateUserDto.isVerified !== undefined) {
        updateData.isVerified = updateUserDto.isVerified;
      }

      await userRef.update(updateData);

      const updatedUserDoc = await userRef.get();
      const updatedUserData = updatedUserDoc.data();

      const updatedUser: User = {
        id: updatedUserDoc.id,
        ...updatedUserData,
      } as User;

      console.log('🔄 Updated user:', {
        userId: updatedUser.id,
        email: updatedUser.email,
      });

      return updatedUser;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating user:', error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      const db = this.database.getDb();
      const userRef = db.collection('users').doc(id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const userData = userDoc.data();
      const user = {
        id: userDoc.id,
        ...userData,
      } as User;

      if (user.role !== Role.USER) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const userEmail = user.email;

      await userRef.delete();

      console.log('🗑️ Deleted user:', {
        userId: id,
        email: userEmail,
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting user:', error);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
