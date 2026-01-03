# Role-Based Access Control (RBAC) Guide

This guide explains how to implement and use role-based access control in your NestJS API.

## Overview

The role system allows you to restrict access to specific routes based on user roles. The system includes:

- **Role Enum**: Defines available roles (`USER`, `ADMIN`, `MANAGER`)
- **Roles Decorator**: Marks routes with required roles
- **RolesGuard**: Enforces role-based access control
- **JWT Integration**: Roles are included in JWT tokens

## Available Roles

Roles are defined in `src/features/auth/enums/role.enum.ts`:

```typescript
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
}
```

## How to Use Roles in Controllers

### Basic Usage

To protect a route with role-based access, use the `@Roles()` decorator along with `@UseGuards()`:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('admin')
export class AdminController {
  // Single role required
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAdminDashboard() {
    return { message: 'Admin dashboard data' };
  }

  // Multiple roles allowed (user needs at least one)
  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  getReports() {
    return { message: 'Reports data' };
  }

  // Public route (no guards)
  @Get('public')
  getPublicData() {
    return { message: 'Public data' };
  }
}
```

### Important Notes

1. **Order Matters**: Always use `JwtAuthGuard` before `RolesGuard`:
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard) // ✅ Correct
   @UseGuards(RolesGuard, JwtAuthGuard) // ❌ Wrong - user might not be authenticated
   ```

2. **Multiple Roles**: When multiple roles are specified, the user needs **at least one** of them:
   ```typescript
   @Roles(Role.ADMIN, Role.MANAGER) // User can be ADMIN OR MANAGER
   ```

3. **Class-Level Guards**: You can apply guards at the controller level:
   ```typescript
   @Controller('admin')
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(Role.ADMIN)
   export class AdminController {
     // All routes in this controller require ADMIN role
     
     @Get('route1')
     getRoute1() { ... }
     
     @Get('route2')
     getRoute2() { ... }
   }
   ```

## User Entity

The `User` entity now includes a `role` field:

```typescript
export interface User {
  id?: string;
  email: string;
  password?: string;
  role: Role; // Required field
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

## Default Role Assignment

- **New Users**: Automatically assigned `Role.USER` when signing up
- **Existing Users**: If a user doesn't have a role, they default to `Role.USER` for backward compatibility

## JWT Token

Roles are included in the JWT token payload:

```typescript
{
  sub: "user-id",
  email: "user@example.com",
  role: "admin" // or "user", "manager"
}
```

## Setting User Roles

### During User Creation

When creating a user programmatically, you can specify a role:

```typescript
// In AuthService
const user = await this.createOrUpdateUser(
  email,
  passwordHash,
  Role.ADMIN // Specify role
);
```

### Updating User Roles

To update a user's role, you'll need to:

1. Update the user document in Firestore
2. The user will need to sign in again to get a new JWT token with the updated role

Example service method to update user role:

```typescript
async updateUserRole(userId: string, newRole: Role): Promise<void> {
  const db = this.database.getDb();
  const userRef = db.collection('users').doc(userId);
  
  await userRef.update({
    role: newRole,
    updatedAt: new Date(),
  });
}
```

## Accessing User Role in Controllers

You can access the authenticated user (including their role) from the request:

```typescript
import { Request } from '@nestjs/common';
import { User } from '../auth/entities/user.entity';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@Request() req) {
    const user = req.user as User;
    
    return {
      id: user.id,
      email: user.email,
      role: user.role, // Access the role
    };
  }
}
```

## Error Handling

When a user tries to access a route without the required role:

- **Status Code**: `403 Forbidden`
- **Response**: Standard NestJS exception response

The `RolesGuard` automatically returns `false` if:
- User is not authenticated (should be caught by `JwtAuthGuard` first)
- User's role doesn't match any of the required roles

## Best Practices

1. **Always use JwtAuthGuard first**: Ensures user is authenticated before checking roles
2. **Use specific roles**: Don't use `@Roles()` without specifying roles (it will allow all authenticated users)
3. **Document role requirements**: Add comments explaining why certain roles are required
4. **Test role-based access**: Write tests for different role scenarios
5. **Keep roles minimal**: Only create roles that are actually needed

## Example: Complete Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Request,
  Body,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../auth/entities/user.entity';

@Controller('users')
export class UsersController {
  // Public route - no authentication required
  @Get('public')
  getPublicUsers() {
    return { message: 'Public user list' };
  }

  // Authenticated users only
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    const user = req.user as User;
    return { user };
  }

  // Admin only
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAllUsers() {
    return { message: 'All users (admin only)' };
  }

  // Admin or Manager
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  updateUser(@Param('id') id: string, @Body() updateData: any) {
    return { message: `Update user ${id}` };
  }

  // Admin only
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteUser(@Param('id') id: string) {
    return { message: `Delete user ${id}` };
  }
}
```

## Testing Roles

When testing endpoints with role requirements:

1. Create test users with different roles
2. Generate JWT tokens for each user
3. Test that:
   - Users with required roles can access the route
   - Users without required roles get 403 Forbidden
   - Unauthenticated users get 401 Unauthorized

## Migration Notes

If you have existing users in your database:

1. Existing users without a `role` field will default to `Role.USER`
2. You may want to run a migration script to assign roles to existing users
3. Users will need to sign in again to get a JWT token with their role

## Summary

- Use `@Roles(Role.ADMIN)` decorator to specify required roles
- Always use `@UseGuards(JwtAuthGuard, RolesGuard)` in that order
- Roles are stored in the User entity and included in JWT tokens
- New users default to `Role.USER`
- Access user role via `req.user.role` in controllers

