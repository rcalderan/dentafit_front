import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Login } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';
import { User, UserRole } from '../../data/user.model';

describe('Login', () => {
  let authService: {
    login: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 'u-1',
    username: 'admin',
    role: UserRole.ADMIN,
    active: true,
    pin: '1234',
    passwordExpired: false,
    ...overrides,
  });

  beforeEach(async () => {
    authService = {
      login: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(false),
    };
    router = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
        { provide: APP_CONFIG, useValue: { appName: 'Rentafit Test' } },
      ],
    }).compileComponents();
  });

  it('cria o componente', () => {
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('redireciona no ngOnInit quando já autenticado', () => {
    authService.isAuthenticated.mockReturnValue(true);
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/home/dashboard']);
  });

  it('redireciona para returnUrl no ngOnInit quando autenticado', () => {
    authService.isAuthenticated.mockReturnValue(true);
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParams: { returnUrl: '/customer/search' } } },
    });

    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/customer/search']);
  });

  it('exibe erro quando campos estão vazios', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.login();
    expect(component.errorMessage()).toBe('Por favor, preencha todos os campos');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('redireciona para setup-credentials quando pin é null', () => {
    const user = buildUser({ pin: null });
    authService.login.mockReturnValue(of(user));

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.username = 'admin';
    component.password = 'admin123';
    component.login();

    expect(authService.login).toHaveBeenCalledWith('admin', 'admin123');
    expect(router.navigate).toHaveBeenCalledWith(['/auth/setup-credentials']);
  });

  it('redireciona para change-password quando passwordExpired é true', () => {
    const user = buildUser({ pin: '1234', passwordExpired: true });
    authService.login.mockReturnValue(of(user));

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.username = 'admin';
    component.password = 'admin123';
    component.login();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/change-password']);
  });

  it('redireciona para dashboard quando login é normal', () => {
    const user = buildUser();
    authService.login.mockReturnValue(of(user));

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.username = 'admin';
    component.password = 'admin123';
    component.login();

    expect(router.navigate).toHaveBeenCalledWith(['/home/dashboard']);
  });

  it('redireciona para returnUrl quando login é normal e returnUrl existe', () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParams: { returnUrl: '/rental/management' } } },
    });

    const user = buildUser();
    authService.login.mockReturnValue(of(user));

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.username = 'admin';
    component.password = 'admin123';
    component.login();

    expect(router.navigate).toHaveBeenCalledWith(['/rental/management']);
  });

  it('exibe mensagem de erro em falha de login', () => {
    authService.login.mockReturnValue(throwError(() => new Error('Credenciais inválidas')));

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.username = 'admin';
    component.password = 'wrong';
    component.login();

    expect(component.errorMessage()).toBe('Credenciais inválidas');
    expect(component.isLoading()).toBe(false);
  });
});
