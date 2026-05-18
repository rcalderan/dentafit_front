import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { MainLayout } from './main-layout';
import { AuthService } from '../../../domains/auth/services/auth.service';

class MockBreakpointObserver {
  observe() {
    return { subscribe: () => {} };
  }
}

class MockAuthService {
  hasRole() {
    return true;
  }
  hasAnyRole() {
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

  beforeEach(async () => {
    routerEvents$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useClass: MockBreakpointObserver },
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
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes all submenus when a submenu link is clicked', () => {
    (component as any).toggleProductSubmenu();
    expect(component['isProductSubmenuOpen']()).toBe(true);

    (component as any).closeAllSubmenus();

    expect(component['isCustomerSubmenuOpen']()).toBe(false);
    expect(component['isProductSubmenuOpen']()).toBe(false);
    expect(component['isRentalSubmenuOpen']()).toBe(false);
    expect(component['isSalesSubmenuOpen']()).toBe(false);
    expect(component['isReportsSubmenuOpen']()).toBe(false);
  });

  it('closes mobile sidebar on NavigationEnd', () => {
    component['isMobile'].set(true);
    component['isSidebarVisible'].set(true);

    routerEvents$.next(new NavigationEnd(1, '/rental/new', '/rental/new'));

    expect(component['isSidebarVisible']()).toBe(false);
  });

  it('toggles product submenu on button click', () => {
    expect(component['isProductSubmenuOpen']()).toBe(false);

    (component as any).toggleProductSubmenu();
    expect(component['isProductSubmenuOpen']()).toBe(true);

    (component as any).toggleProductSubmenu();
    expect(component['isProductSubmenuOpen']()).toBe(false);
  });
});
