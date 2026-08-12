export interface IEmployee {
  id: string;
  name: string;
  document?: string;
  email?: string;
  initials?: string;
  roleLevel?: number;
  legacyId?: number;
}

export interface IEmployeeCheckResponse {
  id: string;
  initials?: string;
  name?: string;
}
