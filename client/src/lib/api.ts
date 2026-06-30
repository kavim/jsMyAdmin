import axios, { AxiosResponse } from 'axios';
import { AuthResponse, DbCredentials, ColumnInfo, DatabaseInfo, HistoryItem, QueryResult, ScriptFile, ScriptNode, TableInfo, UploadedFile } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('connection');
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: DbCredentials): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', credentials),

  logout: (): Promise<AxiosResponse<{ success: boolean }>> => api.post('/auth/logout'),

  verify: (): Promise<AxiosResponse<{ valid: boolean; connection?: AuthResponse['connection'] }>> =>
    api.get('/auth/verify'),
};

export const databaseApi = {
  list: (): Promise<AxiosResponse<DatabaseInfo[]>> => api.get('/databases'),

  listTables: (database: string): Promise<AxiosResponse<TableInfo[]>> =>
    api.get('/databases/' + database + '/tables'),

  getColumns: (database: string, table: string): Promise<AxiosResponse<ColumnInfo[]>> =>
    api.get('/databases/' + database + '/tables/' + table + '/columns'),

  getSchema: (database: string): Promise<AxiosResponse<import('@/types').TableSchema[]>> =>
    api.get('/databases/' + database + '/schema'),
};

export const queryApi = {
  execute: (database: string, sql: string): Promise<AxiosResponse<QueryResult>> =>
    api.post('/query/execute', { database, sql }),

  history: (database?: string): Promise<AxiosResponse<HistoryItem[]>> =>
    api.get('/query/history', { params: { database } }),

  clearHistory: (database?: string): Promise<AxiosResponse<{ success: boolean }>> =>
    api.delete('/query/history', { params: { database } }),

  export: (database: string, sql: string, format: 'csv' | 'json'): Promise<AxiosResponse<Blob>> =>
    api.post('/query/export', { database, sql, format }, { responseType: 'blob' }),
};

export const tableApi = {
  getData: (
    database: string,
    table: string,
    page = 1,
    limit = 100,
    where?: string,
    orderBy?: string
  ) =>
    api.get('/tables/data', {
      params: { database, table, page, limit, where: where || undefined, orderBy: orderBy || undefined },
    }),

  insertRow: (database: string, table: string, data: Record<string, unknown>) =>
    api.post('/tables/row', data, { params: { database, table } }),

  updateRow: (database: string, table: string, data: Record<string, unknown>) =>
    api.patch('/tables/row', data, { params: { database, table } }),

  deleteRow: (database: string, table: string, data: Record<string, unknown>) =>
    api.delete('/tables/row', { data, params: { database, table } }),
};

export const uploadApi = {
  upload: (file: File, database?: string): Promise<AxiosResponse<UploadedFile>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (database) formData.append('database', database);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getProgress: (fileId: string) => api.get('/upload/progress/' + fileId),

  import: (fileId: string, database: string) =>
    api.post('/upload/import', { fileId, database }),

  delete: (fileId: string) => api.delete('/upload/' + fileId),
};

export const scriptsApi = {
  list: (): Promise<AxiosResponse<ScriptNode[]>> => api.get('/scripts'),

  read: (path: string): Promise<AxiosResponse<ScriptFile>> =>
    api.get('/scripts/file', { params: { path } }),

  save: (path: string, content: string): Promise<AxiosResponse<{ path: string; updatedAt: string }>> =>
    api.put('/scripts/file', { path, content }),

  createFolder: (path: string): Promise<AxiosResponse<{ path: string }>> =>
    api.post('/scripts/folder', { path }),

  delete: (path: string): Promise<AxiosResponse<{ deleted: boolean }>> =>
    api.delete('/scripts', { params: { path } }),
};

export default api;
