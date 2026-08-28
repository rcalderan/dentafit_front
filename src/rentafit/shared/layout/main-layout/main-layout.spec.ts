import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { MainLayout } from './main-layout';
import { AuthService } from '../../../domains/auth/services/auth.service';
import { UiVariantService } from '../../services/ui-variant.service';

class MockUiVariantService {
  readonly isMobile = signal(false);
  readonly activeVariant = signal<'simplified' | 'legacy'>('simplified');
}

class MockAuthService {
  hasRole() {
    return true;
  }
  hasAnyRole(roles: string[]) {
    return true;
  }
  logout() {}
}

const mockActivatedRoute = {
  firstChild: null,
  snapshot: { data: {} },
};

describe('MainLayout', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<MainLayout>>;
  let component: MainLayout;
  let routerEvents$: Subject<any>;
  let uiVariant: MockUiVariantService;

  beforeEach(async () => {
    routerEvents$ = new Subject();

    TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        { provide: UiVariantService, useClass: MockUiVariantService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: Router,
          useValue: {
            events: routerEvents$.asObservable(),
            navigate: vi.fn(),
            url: '/home/dashboard',
            createUrlTree: vi.fn(() => ({})),
            serializeUrl: vi.fn(() => ''),
            isActive: vi.fn(() => false),
          },
        },
      ],
    });

    // Simplifica o template para evitar problemas com UserRole no teste
    TestBed.overrideComponent(MainLayout, {
      set: {
        template: `
          <div class="layout-container">
            <aside class="sidebar">
              <nav class="nav-menu">
                <a routerLink="/home/dashboard">Home</a>
                <button (click)="toggleProductSubmenu()">Products</button>
                <button (click)="logout()">Logout</button>
              </nav>
            </aside>
            <main class="main-content">
              <router-outlet></router-outlet>
            </main>
          </div>
        `,
      },
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    uiVariant = TestBed.inject(UiVariantService) as unknown as MockUiVariantService;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('closes all submenus when a submenu link is clicked', () => {
    fixture.detectChanges();
    (component as any).toggleProductSubmenu();
    expect(component['isProductSubmenuOpen']()).toBe(true);

    (component as any).closeAllSubmenus();

    expect(component['isCustomerSubmenuOpen']()).toBe(false);
    expect(component['isProductSubmenuOpen']()).toBe(false);
    expect(component['isRentalSubmenuOpen']()).toBe(false);
    expect(component['isSalesSubmenuOpen']()).toBe(false);
    expect(component['isReportsSubmenuOpen']()).toBe(false);
    expect(component['isAdminSubmenuOpen']()).toBe(false);
  });

  it('closes mobile sidebar on NavigationEnd', () => {
    fixture.detectChanges();
    uiVariant.isMobile.set(true);
    component['isSidebarVisible'].set(true);

    routerEvents$.next(new NavigationEnd(1, '/rental/new', '/rental/new'));

    expect(component['isSidebarVisible']()).toBe(false);
  });

  it('toggles product submenu on button click', () => {
    fixture.detectChanges();
    expect(component['isProductSubmenuOpen']()).toBe(false);

    (component as any).toggleProductSubmenu();
    expect(component['isProductSubmenuOpen']()).toBe(true);

    (component as any).toggleProductSubmenu();
    expect(component['isProductSubmenuOpen']()).toBe(false);
  });

  it('toggles admin submenu on button click', () => {
    fixture.detectChanges();
    expect(component['isAdminSubmenuOpen']()).toBe(false);

    (component as any).toggleAdminSubmenu();
    expect(component['isAdminSubmenuOpen']()).toBe(true);

    (component as any).toggleAdminSubmenu();
    expect(component['isAdminSubmenuOpen']()).toBe(false);
  });
});
