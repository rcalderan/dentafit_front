import { inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../domains/auth/services/auth.service';
import { buildTabId, ITab, tabGroupOf, TAB_GROUPS, TabGroup } from '../data/tab.model';

const STORAGE_KEY_PREFIX = '@rentafit/tabs';

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Manages open tabs in the main layout: ordering, persistence, and navigation. */
@Injectable({ providedIn: 'root' })
export class TabService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  /** Ordered list of open tabs. */
  readonly tabs = signal<ITab[]>(this.loadTabs());

  /** Id of the currently active tab, or null on non-tab routes. */
  readonly activeTabId = signal<string | null>(null);

  /** Debounce handle for persistence. */
  private persistTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.syncActiveTabFromRouter();
  }

  /**
   * Open a new tab or activate an existing one for the given route.
   * Returns the generated draftId, which callers can use to persist form state.
   */
  open(path: string, title: string, group: TabGroup, draftId?: string): string {
    const resolvedDraftId = draftId ?? generateId();
    const id = buildTabId(path, resolvedDraftId);
    const groupMeta = TAB_GROUPS[group];

    const existing = this.tabs().find(t => t.id === id);
    if (existing) {
      this.activate(existing.id);
      return resolvedDraftId;
    }

    const newTab: ITab = {
      id,
      path,
      queryParams: { draftId: resolvedDraftId },
      title,
      group,
      groupOrder: groupMeta.order,
      createdAt: Date.now(),
    };

    this.tabs.update(current => this.sortTabs([...current, newTab]));
    this.activate(id);
    this.router.navigate([path], {
      queryParams: { draftId: resolvedDraftId },
      replaceUrl: false,
    });
    this.schedulePersist();
    return resolvedDraftId;
  }

  /** Activate an existing tab and navigate to its route. */
  activate(tabId: string): void {
    const tab = this.tabs().find(t => t.id === tabId);
    if (!tab) return;

    this.activeTabId.set(tabId);
    this.router.navigate([tab.path], {
      queryParams: tab.queryParams,
      replaceUrl: false,
    });
  }

  /** Close a tab and navigate to the next best target. */
  close(tabId: string): void {
    const currentTabs = this.tabs();
    const index = currentTabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const nextTabs = [...currentTabs];
    nextTabs.splice(index, 1);
    this.tabs.set(this.sortTabs(nextTabs));

    if (this.activeTabId() === tabId) {
      if (nextTabs.length > 0) {
        const fallbackIndex = Math.min(index, nextTabs.length - 1);
        this.activate(nextTabs[fallbackIndex].id);
      } else {
        this.activeTabId.set(null);
        this.router.navigate(['/home/dashboard']);
      }
    }

    this.schedulePersist();
  }

  /** Build the canonical tab id for a route and draft. */
  getTabId(path: string, draftId: string): string {
    return buildTabId(path, draftId);
  }

  /** Update the displayed title of the currently active tab, if any. */
  updateActiveTitle(title: string): void {
    const activeId = this.activeTabId();
    if (activeId) {
      this.updateTitle(activeId, title);
    }
  }

  /** Update the displayed title of a tab. */
  updateTitle(tabId: string, title: string): void {
    const tab = this.tabs().find(t => t.id === tabId);
    if (!tab || tab.title === title) return;

    this.tabs.update(current =>
      this.sortTabs(current.map(t => (t.id === tabId ? { ...t, title } : t)))
    );
    this.schedulePersist();
  }

  /** Close the active tab if it matches a saved entity (used after successful save). */
  closeActiveIf(path: string): void {
    const activeId = this.activeTabId();
    if (!activeId) return;
    const tab = this.tabs().find(t => t.id === activeId && t.path === path);
    if (tab) {
      this.close(tab.id);
    }
  }

  /** Rebuild the tab list from localStorage (useful on login). */
  restore(): void {
    this.tabs.set(this.loadTabs());
    this.syncActiveTabFromRouter();
  }

  private sortTabs(tabs: ITab[]): ITab[] {
    return tabs.sort((a, b) => {
      if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder;
      return a.createdAt - b.createdAt;
    });
  }

  private schedulePersist(): void {
    if (this.persistTimeout) clearTimeout(this.persistTimeout);
    this.persistTimeout = setTimeout(() => this.persistTabs(), 100);
  }

  private persistTabs(): void {
    try {
      const userId = this.authService.getCurrentUser()?.id ?? '_';
      localStorage.setItem(`${STORAGE_KEY_PREFIX}/${userId}`, JSON.stringify(this.tabs()));
    } catch {
      // Ignore quota/private-mode errors.
    }
  }

  private loadTabs(): ITab[] {
    try {
      const userId = this.authService.getCurrentUser()?.id ?? '_';
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}/${userId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ITab[];
      return this.sortTabs(
        (Array.isArray(parsed) ? parsed : [])
          .filter(t => t.path && t.group && TAB_GROUPS[t.group])
          .map(t => ({ ...t, id: buildTabId(t.path, t.queryParams?.['draftId'] ?? t.id) }))
      );
    } catch {
      return [];
    }
  }

  private syncActiveTabFromRouter(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.routerState.snapshot.url;
        const tree = this.router.parseUrl(url);
        const primarySegments = tree.root.children['primary']?.segments;
        const path = primarySegments && primarySegments.length > 0
          ? '/' + primarySegments.map(s => s.path).join('/')
          : '/home/dashboard';
        const draftId = tree.queryParams['draftId'];
        const group = tabGroupOf(path);

        if (!group) {
          this.activeTabId.set(null);
          return;
        }

        const id = buildTabId(path, draftId ?? '_default_');
        const existing = this.tabs().find(t => t.id === id);

        if (existing) {
          this.activeTabId.set(existing.id);
        } else {
          // The user landed here without a tab — add one if the route belongs to a group.
          const title = this.resolveTitle(path);
          this.open(path, title, group, draftId);
        }
      });
  }

  private resolveTitle(path: string): string {
    const config = this.router.config
      .flatMap(r => (r.path === '' && r.children ? r.children : [r]))
      .find(r => r.path && path.endsWith(r.path));
    return (config?.data?.['title'] as string) ?? path;
  }
}
