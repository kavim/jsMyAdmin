import { Navigate } from 'react-router-dom';

/** @deprecated SQL console lives in IdeShell workspace — use /?tab=sql */
export default function QueryConsole() {
  return <Navigate to="/?tab=sql" replace />;
}
