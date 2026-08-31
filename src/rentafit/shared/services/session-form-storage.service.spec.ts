import { TestBed } from '@angular/core/testing';
import { SessionFormStorageService } from './session-form-storage.service';
import { AuthService } from '../../domains/auth/services/auth.service';

class MockAuthService {
  getCurrentUser() {
    return { id: 'user-1', name: 'Tester' };
  }
}

describe('SessionFormStorageService', () => {
  let service: SessionFormStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        SessionFormStorageService,
        { provide: AuthService, useClass: MockAuthService },
      ],
    });
    service = TestBed.inject(SessionFormStorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and loads a draft', () => {
    service.saveDraft('customer', 'draft-1', { name: 'Ana' });
    expect(service.loadDraft<{ name: string }>('customer', 'draft-1')).toEqual({ name: 'Ana' });
  });

  it('returns null for missing drafts', () => {
    expect(service.loadDraft('customer', 'missing')).toBeNull();
  });

  it('lists draft ids by type', () => {
    service.saveDraft('customer', 'a', {});
    service.saveDraft('customer', 'b', {});
    service.saveDraft('sales-order', 'c', {});
    expect(service.listDraftIds('customer').sort()).toEqual(['a', 'b']);
  });

  it('clears a single draft', () => {
    service.saveDraft('customer', 'a', { name: 'Ana' });
    service.clearDraft('customer', 'a');
    expect(service.loadDraft('customer', 'a')).toBeNull();
  });

  it('clears all drafts of a type', () => {
    service.saveDraft('customer', 'a', {});
    service.saveDraft('customer', 'b', {});
    service.clearAllDraftsOfType('customer');
    expect(service.listDraftIds('customer')).toEqual([]);
  });

  it('isolates drafts per user', () => {
    service.saveDraft('customer', 'a', { name: 'Ana' });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SessionFormStorageService,
        { provide: AuthService, useValue: { getCurrentUser: () => ({ id: 'user-2' }) } },
      ],
    });
    const otherUserService = TestBed.inject(SessionFormStorageService);
    expect(otherUserService.loadDraft('customer', 'a')).toBeNull();
  });
});
