/**
 * @deprecated Use useWorkspaceStore — thin compatibility layer for QueryBuilder.
 */
export {
  useWorkspaceStore as useQueryStore,
  useActiveSqlTab as useActiveTab,
} from './workspaceStore';

export type { SqlTab as QueryTab } from './workspaceStore';
