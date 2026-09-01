/** Groups used to order tabs from left to right on the main layout. */
export type TabGroup = 'customer' | 'product' | 'rental' | 'sales' | 'admin';

/** Static metadata for each tab group. */
export interface ITabGroupMeta {
  readonly key: TabGroup;
  readonly order: number;
  readonly label: string;
}

export const TAB_GROUPS: Record<TabGroup, ITabGroupMeta> = {
  customer: { key: 'customer', order: 1, label: 'Clientes' },
  product: { key: 'product', order: 2, label: 'Produtos' },
  rental: { key: 'rental', order: 3, label: 'Locações' },
  sales: { key: 'sales', order: 4, label: 'Vendas' },
  admin: { key: 'admin', order: 5, label: 'Admin' },
};

/** Open tab descriptor persisted to localStorage and rendered in the layout. */
export interface ITab {
  /** Unique identifier for this tab instance (also the draftId when applicable). */
  readonly id: string;
  /** Angular route path. */
  readonly path: string;
  /** Query params to restore when activating the tab (e.g. { draftId: '...' }). */
  readonly queryParams: Record<string, string>;
  /** Display title on the tab bar. */
  readonly title: string;
  /** Group used for ordering. */
  readonly group: TabGroup;
  /** Pre-computed sort order based on the group. */
  readonly groupOrder: number;
  /** Timestamp used as a secondary sort key inside the same group. */
  readonly createdAt: number;
}

/** Maps a route path to its tab group, falling back to undefined for non-tab routes. */
export function tabGroupOf(path: string): TabGroup | undefined {
  if (path.startsWith('/customer')) return 'customer';
  if (path.startsWith('/product')) return 'product';
  if (path.startsWith('/rental')) return 'rental';
  if (path.startsWith('/sales')) return 'sales';
  if (path.startsWith('/admin') || path.startsWith('/finance')) return 'admin';
  return undefined;
}

/** Build a stable tab id from a path + draftId. */
export function buildTabId(path: string, draftId: string): string {
  return `${path}::${draftId}`;
}
