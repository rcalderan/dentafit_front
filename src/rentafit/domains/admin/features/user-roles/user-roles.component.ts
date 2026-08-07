import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserAdminService } from '../../service/user-admin.service';
import { IUserSummary } from '../../data/user-admin.model';
import { UserRole } from '../../../auth/data/user.model';
import { AuthService } from '../../../auth/services/auth.service';

const ROLE_ORDER: UserRole[] = [UserRole.CUSTOMER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN];

@Component({
  selector: 'rentafit-user-roles',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-roles.component.html',
  styleUrl: './user-roles.component.css'
})
export class UserRolesComponent implements OnInit {
  private readonly adminService = inject(UserAdminService);
  private readonly authService = inject(AuthService);

  users = signal<IUserSummary[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  updatingId = signal<string | null>(null);

  readonly allRoles: UserRole[] = ROLE_ORDER;
  readonly currentUser = this.authService.getCurrentUser();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.adminService.listUsers().subscribe({
      next: page => {
        this.users.set(page.content);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  primaryRole(user: IUserSummary): UserRole {
    if (!user.roles?.length) return UserRole.CUSTOMER;
    return [...user.roles].sort((a, b) => ROLE_ORDER.indexOf(b) - ROLE_ORDER.indexOf(a))[0];
  }

  /** Returns roles the current user is allowed to assign to another user. */
  allowedRoles(): UserRole[] {
    if (!this.currentUser) return [];
    const myIdx = ROLE_ORDER.indexOf(this.currentUser.role);
    // A user can only assign roles strictly below their own
    return ROLE_ORDER.filter((_, i) => i < myIdx);
  }

  canEdit(target: IUserSummary): boolean {
    if (!this.currentUser) return false;
    if (target.id === this.currentUser.id) return false;
    const myIdx = ROLE_ORDER.indexOf(this.currentUser.role);
    const targetIdx = ROLE_ORDER.indexOf(this.primaryRole(target));
    return myIdx > targetIdx;
  }

  changeRole(user: IUserSummary, newRole: string): void {
    if (!newRole) return;
    this.updatingId.set(user.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.adminService.updateRole(user.id, { newRole: newRole as UserRole }).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.successMessage.set(`Papel de ${user.name} atualizado com sucesso.`);
        this.load();
      },
      error: (err: Error) => {
        this.updatingId.set(null);
        this.errorMessage.set(err.message);
      }
    });
  }
}
