import { useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function useIdeShortcuts() {
  const { createSqlTab, closeTab, activeTabId, toggleExplorer, toggleToolPanel, tabs, setActiveTab } =
    useWorkspaceStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createSqlTab();
        return;
      }

      if (mod && e.key.toLowerCase() === 'w' && activeTabId) {
        e.preventDefault();
        closeTab(activeTabId);
        return;
      }

      if (mod && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        toggleExplorer();
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleToolPanel();
        return;
      }

      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (tabs.length > 0) {
          const idx = tabs.findIndex((t) => t.id === activeTabId);
          const next = tabs[(idx + 1) % tabs.length];
          setActiveTab(next.id);
        }
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('elendra:open-command-palette'));
      }
    },
    [createSqlTab, closeTab, activeTabId, toggleExplorer, toggleToolPanel, tabs, setActiveTab]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
