import { UserRole } from '../../auth/data/user.model';

export interface IUserSummary {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
}

export interface IUpdateRoleRequest {
  role: UserRole;
  /** Required when elevating to EMPLOYEE/MANAGER and no Employee row exists yet. */
  initials?: string;
  /** Employee role level (defaults to 1 on the backend when omitted). */
  roleLevel?: number;
}

export interface IPagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
