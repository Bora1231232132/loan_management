import { Role } from '../enums/role.enum';

export class AuthResponseDto {
  accessToken: string;
  user: {
    id?: string;
    email: string;
    role: Role;
  };
  message?: string;
}
