/**
 * AppShellSidebar — Collapsible sidebar with domain navigation.
 * Links to Hub sections (Core, Control, Experiences, Lab).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HUB_SECTIONS, ROUTE_TO_DOMAIN } from '../../config/ecosystemRoutes';

const SECTION_ROUTES = {
  [HUB_SECTIONS.CORE]: ['simulation'],
  [HUB_SECTIONS.CONTROL]: ['missioncontrol'],
  [HUB_SECTIONS.EXPERIENCES]: ['minigames', 'mysticquest'],
  [HUB_SECTIONS.LAB]: ['docs', 'admin', 'dobacksoft'],
};

export function AppShellSidebar({ onNavigate, currentRoute, collapsed, onToggle }) {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState(null);

  const meta = ROUTE_TO_DOMAIN[currentRoute];
  const currentSection = meta?.section ?? null;

  const handleNav = (routeId) => {
    onNavigate(routeId);
  };

  if (collapsed) {
    return (
      <aside className="app-shell-sidebar app-shell-sidebar--collapsed">
        <button
          type="button"
          className="app-shell-sidebar-toggle"
          onClick={onToggle}
          aria-label="Expand navigation"
        >
          →
        </button>
      </aside>
    );
  }

  return (
    <aside className="app-shell-sidebar">
      <button
        type="button"
        className="app-shell-sidebar-toggle app-shell-sidebar-toggle--close"
        onClick={onToggle}
        aria-label="Collapse navigation"
      >
        ←
      </button>
      <nav className="app-shell-sidebar-nav">
        {Object.entries(SECTION_ROUTES).map(([section, routes]) => {
          const isExpanded = expandedSection === section || currentSection === section;
          return (
            <div key={section} className="app-shell-sidebar-section">
              <button
                type="button"
                className="app-shell-sidebar-section-title"
                onClick={() => setExpandedSection(isExpanded ? null : section)}
              >
                {section}
              </button>
              {isExpanded && (
                <ul className="app-shell-sidebar-list">
                  {routes.map((routeId) => {
                    const labelKey = ROUTE_TO_DOMAIN[routeId]?.labelKey;
                    const label = labelKey ? t(labelKey) : routeId;
                    const isActive = currentRoute === routeId;
                    return (
                      <li key={routeId}>
                        <button
                          type="button"
                          className={`app-shell-sidebar-item ${isActive ? 'app-shell-sidebar-item--active' : ''}`}
                          onClick={() => handleNav(routeId)}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
