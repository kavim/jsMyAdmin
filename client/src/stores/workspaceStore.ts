import { create } from 'zustand';
import { QueryResult } from '@/types';

export interface WelcomeTab {
  id: string;
  kind: 'welcome';
}

export interface SqlTab {
  id: string;
  kind: 'sql';
  title: string;
  sql: string;
  result: QueryResult | null;
  error: string | null;
  filePath?: string;
  savedSql?: string;
}

export interface TableDataTab {
  id: string;
  kind: 'table-data';
  title: string;
  table: string;
  database: string;
  where: string;
  orderBy: string;
  page: number;
  limit: number;
}

export type WorkspaceTab = WelcomeTab | SqlTab | TableDataTab;

export type ToolPanelView = 'notifications' | 'query-builder' | 'dump';

let sqlTabCounter = 1;

function makeSqlTab(sql = '', title?: string, filePath?: string): SqlTab {
  const name = title ?? (filePath ? filePath.split('/').pop()! : `console_${sqlTabCounter++}`);
  return {
    id: crypto.randomUUID(),
    kind: 'sql',
    title: name,
    sql,
    result: null,
    error: null,
    filePath,
    savedSql: filePath ? sql : undefined,
  };
}

interface WorkspaceState {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  isExecuting: boolean;
  history: { sql: string; timestamp: number }[];
  columnsByTable: Record<string, import('@/types').ColumnInfo[]>;
  explorerVisible: boolean;
  toolPanelVisible: boolean;
  toolPanelView: ToolPanelView;
  insertTextHandler: ((text: string) => void) | null;
  saveHandler: (() => void) | null;
  pendingInsert: string | null;
  pendingSaveAsFolder: string | null;

  createSqlTab: (sql?: string, title?: string) => string;
  openScriptTab: (path: string, content: string) => string;
  openTableTab: (table: string, database: string) => string;
  openSqlWithQuery: (sql: string, title?: string) => string;
  markTabSaved: (id: string, path: string, content: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setTabSql: (id: string, sql: string) => void;
  setTabResult: (id: string, result: QueryResult | null) => void;
  setTabError: (id: string, error: string | null) => void;
  renameTab: (id: string, title: string) => void;
  setExecuting: (executing: boolean) => void;
  addToHistory: (sql: string) => void;
  setColumnsByTable: (
    updater: Record<string, import('@/types').ColumnInfo[]> | ((prev: Record<string, import('@/types').ColumnInfo[]>) => Record<string, import('@/types').ColumnInfo[]>)
  ) => void;
  toggleExplorer: () => void;
  toggleToolPanel: () => void;
  setToolPanelView: (view: ToolPanelView) => void;
  openToolPanel: (view?: ToolPanelView) => void;
  registerInsertTextHandler: (handler: ((text: string) => void) | null) => void;
  registerSaveHandler: (handler: (() => void) | null) => void;
  consumePendingInsert: () => void;
  requestSaveAs: (folder?: string) => void;
  consumePendingSaveAs: () => string | null;
  insertIntoActiveEditor: (text: string) => void;
  reorderTab: (fromIndex: number, toIndex: number) => void;
  updateTableTab: (id: string, patch: Partial<Pick<TableDataTab, 'where' | 'orderBy' | 'page' | 'limit'>>) => void;
  /** @deprecated use setTabSql on active tab */
  setSql: (sql: string) => void;
  /** @deprecated use setTabResult on active tab */
  setResult: (result: QueryResult | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isExecuting: false,
  history: [],
  columnsByTable: {},
  explorerVisible: true,
  toolPanelVisible: true,
  toolPanelView: 'notifications',
  insertTextHandler: null,
  saveHandler: null,
  pendingInsert: null,
  pendingSaveAsFolder: null,

  createSqlTab: (sql = '', title?: string) => {
    const tab = makeSqlTab(sql, title);
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }));
    return tab.id;
  },

  openScriptTab: (path, content) => {
    const existing = get().tabs.find(
      (t) => t.kind === 'sql' && t.filePath === path
    );
    if (existing) {
      set({ activeTabId: existing.id });
      return existing.id;
    }
    const tab = makeSqlTab(content, path.split('/').pop(), path);
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }));
    return tab.id;
  },

  openTableTab: (table, database) => {
    const existing = get().tabs.find(
      (t) => t.kind === 'table-data' && t.table === table && t.database === database
    );
    if (existing) {
      set({ activeTabId: existing.id });
      return existing.id;
    }
    const tab: TableDataTab = {
      id: crypto.randomUUID(),
      kind: 'table-data',
      title: table,
      table,
      database,
      where: '',
      orderBy: '',
      page: 1,
      limit: 100,
    };
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }));
    return tab.id;
  },

  openSqlWithQuery: (sql, title) => {
    return get().createSqlTab(sql, title);
  },

  closeTab: (id) => {
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== id);
      let activeTabId = state.activeTabId;
      if (activeTabId === id) {
        activeTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null;
      }
      return { tabs, activeTabId };
    });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  setTabSql: (id, sql) =>
    set((state) => ({
      tabs: state.tabs.map((t) => {
        if (t.id !== id || t.kind !== 'sql') return t;
        return { ...t, sql };
      }),
    })),

  markTabSaved: (id, path, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) => {
        if (t.id !== id || t.kind !== 'sql') return t;
        const fileName = path.split('/').pop() ?? path;
        return {
          ...t,
          filePath: path,
          savedSql: content,
          sql: content,
          title: fileName,
        };
      }),
    })),

  setTabResult: (id, result) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id && t.kind === 'sql' ? { ...t, result, error: null } : t
      ),
    })),

  setTabError: (id, error) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id && t.kind === 'sql' ? { ...t, error, result: null } : t
      ),
    })),

  renameTab: (id, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    })),

  setExecuting: (executing) => set({ isExecuting: executing }),

  addToHistory: (sql) =>
    set((state) => ({
      history: [{ sql, timestamp: Date.now() }, ...state.history].slice(0, 50),
    })),

  setColumnsByTable: (updater) =>
    set((state) => ({
      columnsByTable:
        typeof updater === 'function' ? updater(state.columnsByTable) : updater,
    })),

  toggleExplorer: () => set((s) => ({ explorerVisible: !s.explorerVisible })),

  toggleToolPanel: () => set((s) => ({ toolPanelVisible: !s.toolPanelVisible })),

  setToolPanelView: (view) => set({ toolPanelView: view, toolPanelVisible: true }),

  openToolPanel: (view = 'notifications') =>
    set({ toolPanelView: view, toolPanelVisible: true }),

  registerInsertTextHandler: (handler) => set({ insertTextHandler: handler }),

  registerSaveHandler: (handler) => set({ saveHandler: handler }),

  insertIntoActiveEditor: (text) => {
    const { activeTabId, tabs, insertTextHandler } = get();
    const active = tabs.find((t) => t.id === activeTabId);
    if (active?.kind === 'sql' && insertTextHandler) {
      insertTextHandler(text);
      return;
    }
    get().createSqlTab();
    set({ pendingInsert: text });
  },

  consumePendingInsert: () => {
    const text = get().pendingInsert;
    if (text && get().insertTextHandler) {
      get().insertTextHandler!(text);
    }
    set({ pendingInsert: null });
  },

  requestSaveAs: (folder = '') => set({ pendingSaveAsFolder: folder }),

  consumePendingSaveAs: () => {
    const folder = get().pendingSaveAsFolder;
    set({ pendingSaveAsFolder: null });
    return folder;
  },

  reorderTab: (fromIndex, toIndex) =>
    set((state) => {
      const tabs = [...state.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { tabs };
    }),

  updateTableTab: (id, patch) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id && t.kind === 'table-data' ? { ...t, ...patch } : t
      ),
    })),

  setSql: (sql) => {
    const { activeTabId } = get();
    if (activeTabId) get().setTabSql(activeTabId, sql);
  },

  setResult: (result) => {
    const { activeTabId } = get();
    if (activeTabId) get().setTabResult(activeTabId, result);
  },
}));

export function useActiveWorkspaceTab(): WorkspaceTab | null {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  if (!activeTabId) return null;
  return tabs.find((t) => t.id === activeTabId) ?? null;
}

export function useActiveSqlTab(): SqlTab | null {
  const tab = useActiveWorkspaceTab();
  return tab?.kind === 'sql' ? tab : null;
}

export function isSqlTabDirty(tab: SqlTab): boolean {
  if (tab.filePath && tab.savedSql !== undefined) {
    return tab.sql !== tab.savedSql;
  }
  return tab.sql.trim().length > 0;
}
