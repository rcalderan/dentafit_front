import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, retry, shareReplay, tap } from 'rxjs/operators';

// ── BrasilAPI response shape ────────────────────────────────────────────────

export interface IBrasilAPIHoliday {
  date: string;   // "YYYY-MM-DD"
  name: string;
  type: string;
}

// ── localStorage cache shape ────────────────────────────────────────────────

interface ICachedHolidays {
  year: number;
  dates: string[];
  cachedAt: number; // Unix timestamp (ms)
}

// ── Constants ───────────────────────────────────────────────────────────────

const BRASIL_API_BASE = 'https://brasilapi.com.br/api/feriados/v1';
// Cache TTL: 30 days. Holidays for a given year are stable once published.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_KEY = (year: number) => `@rentafit/holidays/${year}`;

// Retry delays: 1s → 2s → 4s  (retryCount is 1-based)
const RETRY_DELAY_MS = (retryCount: number) =>
  Math.pow(2, retryCount - 1) * 1_000;

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private readonly http = inject(HttpClient);

  /** In-memory cache to avoid redundant localStorage reads within a session. */
  private readonly memCache = new Map<number, Set<string>>();

  /** Per-year observables backed by shareReplay(1) so concurrent callers
   *  share the same in-flight request. */
  private readonly pendingRequests = new Map<number, Observable<Set<string>>>();

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * Returns an observable that emits a `Set<string>` of holiday date strings
   * ("YYYY-MM-DD") for the requested year.
   *
   * Resolution order:
   *   1. In-memory cache (same session)
   *   2. localStorage  (valid for CACHE_TTL_MS)
   *   3. BrasilAPI     (3 retries: 1 s / 2 s / 4 s back-off)
   *
   * If all layers fail, emits an empty Set (holiday check bypassed) and
   * logs a console warning — no hard-coded fallback data is used.
   */
  getHolidays(year: number): Observable<Set<string>> {
    // 1. In-memory hit
    const mem = this.memCache.get(year);
    if (mem) {
      return of(mem);
    }

    // 2. localStorage hit (still fresh)
    const fromStorage = this.readFromStorage(year);
    if (fromStorage) {
      this.memCache.set(year, fromStorage);
      return of(fromStorage);
    }

    // 3. Deduplicated network call
    const cached$ = this.pendingRequests.get(year);
    if (cached$) return cached$;

    const request$ = this.fetchFromApi(year).pipe(
      tap(set => {
        this.memCache.set(year, set);
        this.writeToStorage(year, set);
        this.pendingRequests.delete(year);
      }),
      catchError(() => {
        this.pendingRequests.delete(year);
        console.warn(
          `HolidayService: unable to load holidays for ${year} – holiday check will be skipped.`,
        );
        return of(new Set<string>());
      }),
      shareReplay(1),
    );

    this.pendingRequests.set(year, request$);
    return request$;
  }

  /**
   * Convenience helper: returns `true` if `date` falls on a national holiday.
   * The call is async (Observable) because the data may need to be fetched.
   */
  isHoliday(date: Date): Observable<boolean> {
    const iso = this.toISO(date);
    return this.getHolidays(date.getFullYear()).pipe(
      map(set => set.has(iso)),
    );
  }

  /**
   * Clears stored cache for a given year (or all years when omitted).
   * Useful for forcing a refresh in admin or test scenarios.
   */
  clearCache(year?: number): void {
    if (year !== undefined) {
      localStorage.removeItem(CACHE_KEY(year));
      this.memCache.delete(year);
    } else {
      for (const key of Object.keys(localStorage).filter(k =>
        k.startsWith('@rentafit/holidays/'),
      )) {
        localStorage.removeItem(key);
      }
      this.memCache.clear();
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /** Fetch from BrasilAPI with exponential-backoff retry (max 3 attempts). */
  private fetchFromApi(year: number): Observable<Set<string>> {
    return this.http.get<IBrasilAPIHoliday[]>(`${BRASIL_API_BASE}/${year}`).pipe(
      retry({
        count: 3,
        delay: (_err, retryCount) => timer(RETRY_DELAY_MS(retryCount)),
      }),
      map(holidays => new Set(holidays.map(h => h.date))),
    );
  }

  /** Read a valid (non-expired) entry from localStorage. */
  private readFromStorage(year: number): Set<string> | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY(year));
      if (!raw) return null;

      const parsed: ICachedHolidays = JSON.parse(raw);
      const isExpired = Date.now() - parsed.cachedAt > CACHE_TTL_MS;
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY(year));
        return null;
      }

      return new Set(parsed.dates);
    } catch {
      return null;
    }
  }

  /** Persist a holiday set to localStorage. */
  private writeToStorage(year: number, set: Set<string>): void {
    try {
      const entry: ICachedHolidays = {
        year,
        dates: [...set],
        cachedAt: Date.now(),
      };
      localStorage.setItem(CACHE_KEY(year), JSON.stringify(entry));
    } catch {
      // Quota exceeded or private mode — ignore silently.
    }
  }

  private toISO(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
