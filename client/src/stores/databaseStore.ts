import { create } from 'zustand';
import { DatabaseInfo, TableInfo, ColumnInfo } from '@/types';

interface DatabaseState {
  databases: DatabaseInfo[];
  currentDatabase: string | null;
  tables: TableInfo[];
  columns: ColumnInfo[];
  selectedTable: string | null;
  isLoading: boolean;
  setDatabases: (databases: DatabaseInfo[]) => void;
  setCurrentDatabase: (database: string | null) => void;
  setTables: (tables: TableInfo[]) => void;
  setColumns: (columns: ColumnInfo[]) => void;
  setSelectedTable: (table: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useDatabaseStore = create<DatabaseState>((set) => ({
  databases: [],
  currentDatabase: null,
  tables: [],
  columns: [],
  selectedTable: null,
  isLoading: false,
  setDatabases: (databases) => set({ databases }),
  setCurrentDatabase: (database) => set({ currentDatabase: database }),
  setTables: (tables) => set({ tables }),
  setColumns: (columns) => set({ columns }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () =>
    set({
      databases: [],
      currentDatabase: null,
      tables: [],
      columns: [],
      selectedTable: null,
      isLoading: false,
    }),
}));