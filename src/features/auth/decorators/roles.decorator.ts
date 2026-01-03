import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/**
 * Roles metadata key for storing role requirements
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route handler
 * @param roles - Array of roles that can access this route
 * @example
 * @Roles(Role.ADMIN)
 * @Get('admin-only')
 * getAdminData() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

