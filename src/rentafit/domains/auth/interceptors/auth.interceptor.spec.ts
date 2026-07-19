import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: { getAccessToken: ReturnType<typeof vi.fn>; refreshToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      getAccessToken: vi.fn().mockReturnValue('access-token'),
      refreshToken: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('propagates a forbidden response without refreshing or logging out', async () => {
    const response = new Promise<HttpErrorResponse>((resolve) => {
      http.get('/api/v1/products/rental/byLegacy/011').subscribe({ error: resolve });
    });

    const request = httpMock.expectOne('/api/v1/products/rental/byLegacy/011');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush({ message: 'Acesso negado' }, { status: 403, statusText: 'Forbidden' });

    const error = await response;
    expect(error.status).toBe(403);
    expect(authService.refreshToken).not.toHaveBeenCalled();
    expect(authService.logout).not.toHaveBeenCalled();
  });
});
