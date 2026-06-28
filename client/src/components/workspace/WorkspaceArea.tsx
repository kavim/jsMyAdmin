import WelcomeTab from './WelcomeTab';
import SqlTabView from './SqlTabView';
import TableDataView from './TableDataView';
import { useWorkspaceStore, useActiveWorkspaceTab } from '@/stores/workspaceStore';

export default function WorkspaceArea() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeTab = useActiveWorkspaceTab();

  if (tabs.length === 0 || !activeTab) {
    return <WelcomeTab />;
  }

  if (activeTab.kind === 'sql') {
    return <SqlTabView tab={activeTab} />;
  }

  if (activeTab.kind === 'table-data') {
    return <TableDataView tab={activeTab} />;
  }

  return <WelcomeTab />;
}
