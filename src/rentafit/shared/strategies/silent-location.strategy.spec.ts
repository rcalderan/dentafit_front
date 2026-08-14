import { TestBed } from '@angular/core/testing';
import { PlatformLocation, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { vi } from 'vitest';
import { SilentLocationStrategy } from './silent-location.strategy';

describe('SilentLocationStrategy', () => {
  let strategy: SilentLocationStrategy;
  let platformLocation: any;

  beforeEach(() => {
    platformLocation = {
      pathname: '/auth/login',
      search: '',
      hash: '',
      getBaseHrefFromDOM: () => '/',
      onPopState: vi.fn(),
      onHashChange: vi.fn(),
      replaceState: vi.fn(),
      pushState: vi.fn(),
      forward: vi.fn(),
      back: vi.fn(),
      getState: () => null,
      historyGo: vi.fn(),
      href: 'http://localhost:4200/auth/login',
      protocol: 'http:',
      hostname: 'localhost',
      port: '4200',
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PlatformLocation, useValue: platformLocation },
        { provide: LocationStrategy, useClass: SilentLocationStrategy },
      ]
    });

    strategy = TestBed.inject(LocationStrategy) as SilentLocationStrategy;
  });

  it('retorna o path inicial na primeira chamada a path()', () => {
    const firstPath = strategy.path();
    expect(firstPath).toContain('/auth/login');
  });

  it('retorna "/" nas chamadas subsequentes a path()', () => {
    // Consome o initial path
    strategy.path();

    const secondPath = strategy.path();
    expect(secondPath).toBe('/');

    const thirdPath = strategy.path();
    expect(thirdPath).toBe('/');
  });

  it('pushState sempre escreve "/" no browser mantendo a origem', () => {
    const spy = vi.spyOn(platformLocation, 'replaceState');

    strategy.pushState({}, '', '/finance/dashboard', '');

    expect(spy).toHaveBeenCalledWith({}, '', 'http://localhost:4200/');
    spy.mockRestore();
  });

  it('replaceState sempre escreve "/" no browser mantendo a origem', () => {
    const spy = vi.spyOn(platformLocation, 'replaceState');

    strategy.replaceState({}, '', '/customer/registration', '?id=1');

    expect(spy).toHaveBeenCalledWith({}, '', 'http://localhost:4200/');
    spy.mockRestore();
  });

  it('captura query params e hash no initial path', () => {
    // Cria nova instância com query params e hash
    const locWithParams: any = {
      pathname: '/finance/dashboard',
      search: '?returnUrl=/admin',
      hash: '#section',
      getBaseHrefFromDOM: () => '/',
      onPopState: vi.fn(),
      onHashChange: vi.fn(),
      replaceState: vi.fn(),
      pushState: vi.fn(),
      forward: vi.fn(),
      back: vi.fn(),
      getState: () => null,
      historyGo: vi.fn(),
      href: 'http://localhost:4200/finance/dashboard?returnUrl=/admin#section',
      protocol: 'http:',
      hostname: 'localhost',
      port: '4200',
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PlatformLocation, useValue: locWithParams },
        { provide: LocationStrategy, useClass: SilentLocationStrategy },
      ]
    });

    const s = TestBed.inject(LocationStrategy) as SilentLocationStrategy;
    const firstPath = s.path();
    expect(firstPath).toBe('/finance/dashboard?returnUrl=/admin#section');

    const secondPath = s.path();
    expect(secondPath).toBe('/');
  });
});
