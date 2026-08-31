import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { TabService } from './tab.service';
import { AuthService } from '../../domains/auth/services/auth.service';
import { ITab } from '../data/tab.model';

class MockAuthService {
  getCurrentUser() {
    return { id: 'user-1' };
  }
}

describe('TabService', () => {
  let service: TabService;
  let routerEvents$: Subject<NavigationEnd>;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    routerEvents$ = new Subject();
    navigateSpy = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        TabService,
        { provide: AuthService, useClass: MockAuthService },
        provideRouter([]),
        {
          provide: Router,
          useValue: {
            events: routerEvents$.asObservable(),
            navigate: navigateSpy,
            routerState: { snapshot: { url: '' } },
            parseUrl: (url: string) => ({
              root: { children: { primary: { segments: url.replace(/^\//, '').split('/').filter(Boolean).map(path => ({ path })) } } },
              queryParams: {},
            }),
            config: [],
          },
        },
      ],
    });

    router = TestBed.inject(Router);
    service = TestBed.inject(TabService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('opens a tab and navigates with a draftId', () => {
    const draftId = service.open('/customer/registration', 'Clientes', 'customer');
    expect(service.tabs().length).toBe(1);
    expect(service.tabs()[0].path).toBe('/customer/registration');
    expect(service.tabs()[0].queryParams['draftId']).toBe(draftId);
    expect(navigateSpy).toHaveBeenCalledWith(['/customer/registration'], expect.objectContaining({ queryParams: { draftId } }));
  });

  it('activates an existing tab instead of duplicating it', () => {
    const draftId = service.open('/customer/registration', 'Clientes', 'customer');
    service.open('/customer/registration', 'Clientes', 'customer', draftId);
    expect(service.tabs().length).toBe(1);
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('orders tabs by group', () => {
    service.open('/sales/new', 'Venda', 'sales');
    service.open('/customer/registration', 'Clientes', 'customer');
    service.open('/rental/new', 'Locação', 'rental');
    expect(service.tabs().map(t => t.group)).toEqual(['customer', 'rental', 'sales']);
  });

  it('closes a tab and falls back to the next one', () => {
    service.open('/customer/registration', 'Clientes', 'customer');
    const salesDraft = service.open('/sales/new', 'Venda', 'sales');
    service.close(service.tabs()[0].id);
    expect(service.tabs().length).toBe(1);
    expect(service.activeTabId()).toBe(service.tabs()[0].id);
    expect(navigateSpy).toHaveBeenLastCalledWith(['/sales/new'], expect.objectContaining({ queryParams: { draftId: salesDraft } }));
  });

  it('navigates to dashboard when the last tab is closed', () => {
    service.open('/customer/registration', 'Clientes', 'customer');
    service.close(service.tabs()[0].id);
    expect(service.tabs().length).toBe(0);
    expect(navigateSpy).toHaveBeenLastCalledWith(['/home/dashboard']);
  });

  it('persists tabs to localStorage', async () => {
    service.open('/customer/registration', 'Clientes', 'customer');
    await new Promise(r => setTimeout(r, 200));
    const raw = localStorage.getItem('@rentafit/tabs/user-1');
    expect(raw).toBeTruthy();
    const parsed: ITab[] = JSON.parse(raw!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].path).toBe('/customer/registration');
  });

  it('updates a tab title without duplicating tabs', () => {
    const draftId = service.open('/customer/registration', 'Clientes', 'customer');
    const tabId = service.getTabId('/customer/registration', draftId);
    service.updateTitle(tabId, 'Cli: JCM');
    expect(service.tabs().length).toBe(1);
    expect(service.tabs()[0].title).toBe('Cli: JCM');
  });

  it('keeps two instances of the same route as separate tabs', () => {
    const draftA = service.open('/customer/registration', 'Clientes', 'customer');
    const draftB = service.open('/customer/registration', 'Clientes', 'customer');
    expect(service.tabs().length).toBe(2);
    expect(draftA).not.toBe(draftB);
    expect(service.tabs()[0].id).not.toBe(service.tabs()[1].id);
  });
});
