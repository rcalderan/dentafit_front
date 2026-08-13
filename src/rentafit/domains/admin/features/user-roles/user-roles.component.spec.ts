import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UserRolesComponent } from './user-roles.component';
import { UserAdminService } from '../../service/user-admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';
import { User, UserRole } from '../../../auth/data/user.model';
import { IUserSummary } from '../../data/user-admin.model';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'u-current',
  username: 'current',
  role: UserRole.ADMIN,
  active: true,
  pinConfigured: true,
  passwordExpired: false,
  ...overrides,
} as User);

const buildSummary = (overrides: Partial<IUserSummary> = {}): IUserSummary => ({
  id: 'u-target',
  username: 'target',
  name: 'Target',
  roles: [UserRole.CUSTOMER],
  active: true,
  ...overrides,
});

const emptyPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 20,
};

describe('UserRolesComponent', () => {
  let adminService: {
    listUsers: ReturnType<typeof vi.fn>;
    updateRole: ReturnType<typeof vi.fn>;
  };
  let authService: {
    getCurrentUser: ReturnType<typeof vi.fn>;
  };

  const makeComponent = () => TestBed.createComponent(UserRolesComponent).componentInstance;

  beforeEach(async () => {
    adminService = {
      listUsers: vi.fn().mockReturnValue(of(emptyPage)),
      updateRole: vi.fn().mockReturnValue(of(undefined)),
    };
    authService = {
      getCurrentUser: vi.fn().mockReturnValue(buildUser()),
    };

    await TestBed.configureTestingModule({
      imports: [UserRolesComponent],
      providers: [
        { provide: UserAdminService, useValue: adminService },
        { provide: AuthService, useValue: authService },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '' } },
      ],
    }).compileComponents();
  });

  it('cria o componente', () => {
    const component = makeComponent();
    expect(component).toBeTruthy();
  });

  describe('primaryRole', () => {
    it('retorna CUSTOMER como padrão quando o usuário não tem papéis', () => {
      const component = makeComponent();
      const user = buildSummary({ roles: [] });
      expect(component.primaryRole(user)).toBe(UserRole.CUSTOMER);
    });

    it('retorna o papel de maior hierarquia entre múltiplos papéis', () => {
      const component = makeComponent();
      const user = buildSummary({ roles: [UserRole.CUSTOMER, UserRole.EMPLOYEE] });
      expect(component.primaryRole(user)).toBe(UserRole.EMPLOYEE);
    });

    it('retorna ADMIN quando o papel estiver presente', () => {
      const component = makeComponent();
      const user = buildSummary({ roles: [UserRole.ADMIN] });
      expect(component.primaryRole(user)).toBe(UserRole.ADMIN);
    });
  });

  describe('allowedRoles', () => {
    it('ADMIN pode atribuir CUSTOMER, EMPLOYEE, MANAGER e ADMIN', () => {
      authService.getCurrentUser.mockReturnValue(buildUser({ role: UserRole.ADMIN }));
      const component = makeComponent();
      expect(component.allowedRoles()).toEqual([
        UserRole.CUSTOMER,
        UserRole.EMPLOYEE,
        UserRole.MANAGER,
        UserRole.ADMIN,
      ]);
    });

    it('MANAGER pode atribuir CUSTOMER, EMPLOYEE e MANAGER, mas não ADMIN', () => {
      authService.getCurrentUser.mockReturnValue(buildUser({ role: UserRole.MANAGER }));
      const component = makeComponent();
      expect(component.allowedRoles()).toEqual([
        UserRole.CUSTOMER,
        UserRole.EMPLOYEE,
        UserRole.MANAGER,
      ]);
    });

    it('EMPLOYEE pode atribuir CUSTOMER e EMPLOYEE', () => {
      authService.getCurrentUser.mockReturnValue(buildUser({ role: UserRole.EMPLOYEE }));
      const component = makeComponent();
      expect(component.allowedRoles()).toEqual([UserRole.CUSTOMER, UserRole.EMPLOYEE]);
    });

    it('CUSTOMER só pode atribuir CUSTOMER', () => {
      authService.getCurrentUser.mockReturnValue(buildUser({ role: UserRole.CUSTOMER }));
      const component = makeComponent();
      expect(component.allowedRoles()).toEqual([UserRole.CUSTOMER]);
    });

    it('retorna lista vazia quando não há usuário logado', () => {
      authService.getCurrentUser.mockReturnValue(null);
      const component = makeComponent();
      expect(component.allowedRoles()).toEqual([]);
    });
  });

  describe('canEdit', () => {
    beforeEach(() => {
      authService.getCurrentUser.mockReturnValue(buildUser({ id: 'u-admin', role: UserRole.ADMIN }));
    });

    it('ADMIN pode editar MANAGER, EMPLOYEE e CUSTOMER', () => {
      const component = makeComponent();
      expect(component.canEdit(buildSummary({ id: 'u-manager', roles: [UserRole.MANAGER] }))).toBe(true);
      expect(component.canEdit(buildSummary({ id: 'u-employee', roles: [UserRole.EMPLOYEE] }))).toBe(true);
      expect(component.canEdit(buildSummary({ id: 'u-customer', roles: [UserRole.CUSTOMER] }))).toBe(true);
    });

    it('ADMIN não edita outro ADMIN', () => {
      const component = makeComponent();
      expect(component.canEdit(buildSummary({ id: 'u-other-admin', roles: [UserRole.ADMIN] }))).toBe(false);
    });

    it('nenhum usuário pode editar a si mesmo', () => {
      const component = makeComponent();
      expect(component.canEdit(buildSummary({ id: 'u-admin', roles: [UserRole.MANAGER] }))).toBe(false);
    });

    it('MANAGER pode editar EMPLOYEE e CUSTOMER, mas não MANAGER nem ADMIN', () => {
      authService.getCurrentUser.mockReturnValue(buildUser({ id: 'u-manager', role: UserRole.MANAGER }));
      const component = makeComponent();
      expect(component.canEdit(buildSummary({ id: 'u-employee', roles: [UserRole.EMPLOYEE] }))).toBe(true);
      expect(component.canEdit(buildSummary({ id: 'u-customer', roles: [UserRole.CUSTOMER] }))).toBe(true);
      expect(component.canEdit(buildSummary({ id: 'u-other-manager', roles: [UserRole.MANAGER] }))).toBe(false);
      expect(component.canEdit(buildSummary({ id: 'u-admin', roles: [UserRole.ADMIN] }))).toBe(false);
    });

    it('CUSTOMER não edita ninguém', () => {
      authService.getCurrentUser.mockReturnValue(buildUser({ id: 'u-customer', role: UserRole.CUSTOMER }));
      const component = makeComponent();
      expect(component.canEdit(buildSummary({ id: 'u-other-customer', roles: [UserRole.CUSTOMER] }))).toBe(false);
    });
  });

  describe('changeRole', () => {
    it('chama updateRole com o userId e o novo papel', () => {
      const component = makeComponent();
      const user = buildSummary({ id: 'u-target' });
      component.changeRole(user, UserRole.EMPLOYEE);
      expect(adminService.updateRole).toHaveBeenCalledWith('u-target', { newRole: UserRole.EMPLOYEE });
    });

    it('não chama updateRole quando o papel é vazio', () => {
      const component = makeComponent();
      const user = buildSummary({ id: 'u-target' });
      component.changeRole(user, '');
      expect(adminService.updateRole).not.toHaveBeenCalled();
    });

    it('recarrega a lista após atualização bem-sucedida', () => {
      const component = makeComponent();
      component.changeRole(buildSummary({ id: 'u-target', name: 'Target' }), UserRole.MANAGER);
      expect(adminService.listUsers).toHaveBeenCalledTimes(2); // ngOnInit + após sucesso
    });
  });
});
