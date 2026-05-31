import { UserRole } from '../../auth/data/user.model';

export interface IUserSummary {
  id: string;
  username: string;
  name: string;
  roles: UserRole[];
  active: boolean;
}

export interface IUpdateRoleRequest {
  newRole: UserRole;
}

export interface IPagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
