/**
 * AppShell — Common UI wrapper for ecosystem routes.
 * Provides header, breadcrumbs, and optional sidebar.
 * Landing, LandingPublic, and FireSimulator stay outside.
 */
import { useState } from 'react';
import { AppShellHeader } from './AppShellHeader';
import { AppShellBreadcrumbs } from './AppShellBreadcrumbs';
import { AppShellSidebar } from './AppShellSidebar';
import { AppShellContextBar } from './AppShellContextBar';

export function AppShell({ children, routeId, onNavigate, contextBar }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="app-shell">
      <AppShellHeader onNavigate={onNavigate} currentRoute={routeId} />
      {contextBar && <AppShellContextBar>{contextBar}</AppShellContextBar>}
      <div className="app-shell-body">
        <AppShellSidebar
          onNavigate={onNavigate}
          currentRoute={routeId}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="app-shell-main">
          <AppShellBreadcrumbs routeId={routeId} onNavigate={onNavigate} />
          <div className="app-shell-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
