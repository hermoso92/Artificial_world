/**
 * AppShellContextBar — Optional context strip (e.g. current world, status).
 * Minimal by default; modules can pass context via children.
 */
export function AppShellContextBar({ children }) {
  if (!children) return null;

  return (
    <div className="app-shell-context-bar">
      {children}
    </div>
  );
}
