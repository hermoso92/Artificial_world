/**
 * AppShellBreadcrumbs — Breadcrumb trail for current route.
 */
import { getBreadcrumbsForRoute } from '../../config/ecosystemRoutes';

export function AppShellBreadcrumbs({ routeId, onNavigate }) {
  const crumbs = getBreadcrumbsForRoute(routeId);
  if (!crumbs || crumbs.length === 0) return null;

  return (
    <nav className="app-shell-breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        const isHub = crumb === 'Hub';
        return (
          <span key={crumb} className="app-shell-breadcrumb-wrap">
            {i > 0 && <span className="app-shell-breadcrumb-sep">/</span>}
            {isHub && !isLast ? (
              <button
                type="button"
                className="app-shell-breadcrumb-link"
                onClick={() => onNavigate('hub')}
              >
                {crumb}
              </button>
            ) : (
              <span className={`app-shell-breadcrumb-text ${isLast ? 'app-shell-breadcrumb-text--current' : ''}`}>
                {crumb}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
