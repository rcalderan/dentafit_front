import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../domains/auth/services/auth.service';

interface IStoredDraft<T> {
  readonly data: T;
  readonly savedAt: number;
}

const STORAGE_KEY_PREFIX = '@rentafit/draft';

/**
 * Saves unsaved form state to localStorage keyed by the logged-in user.
 *
 * The shape of `T` is owned by each component; callers must ensure that only
 * plain JSON-serialisable data is passed.
 */
@Injectable({ providedIn: 'root' })
export class SessionFormStorageService {
  private readonly authService = inject(AuthService);

  /** Persist a draft snapshot. */
  saveDraft<T>(formType: string, draftId: string, data: T): void {
    try {
      const entry: IStoredDraft<T> = { data, savedAt: Date.now() };
      localStorage.setItem(this.key(formType, draftId), JSON.stringify(entry));
    } catch {
      // Quota exceeded or private mode — ignore silently.
    }
  }

  /** Load a previously saved draft, or null if missing/invalid. */
  loadDraft<T>(formType: string, draftId: string): T | null {
    try {
      const raw = localStorage.getItem(this.key(formType, draftId));
      if (!raw) return null;
      const parsed: IStoredDraft<T> = JSON.parse(raw);
      return parsed.data ?? null;
    } catch {
      return null;
    }
  }

  /** Remove a single draft from storage. */
  clearDraft(formType: string, draftId: string): void {
    try {
      localStorage.removeItem(this.key(formType, draftId));
    } catch {
      // Ignore read errors in restricted environments.
    }
  }

  /** List all draft ids stored for a given form type. */
  listDraftIds(formType: string): string[] {
    const prefix = this.key(formType, '');
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(prefix))
        .map(key => key.slice(prefix.length));
    } catch {
      return [];
    }
  }

  /** Remove every draft of a given form type. */
  clearAllDraftsOfType(formType: string): void {
    this.listDraftIds(formType).forEach(id => this.clearDraft(formType, id));
  }

  private key(formType: string, draftId: string): string {
    const userId = this.authService.getCurrentUser()?.id ?? '_';
    return `${STORAGE_KEY_PREFIX}/${userId}/${formType}/${draftId}`;
  }
}
