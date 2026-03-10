/**
 * Ecosystem taxonomy and route mapping for Artificial World.
 * Maps internal routes to visible domains (World, Refuge, Control, Experiences, Lab).
 * Single source of truth for navigation hierarchy and shell integration.
 */

/** Visible domain taxonomy for UI organization */
export const DOMAINS = {
  WORLD: 'World',
  REFUGE: 'Refuge',
  CONTROL: 'Control',
  EXPERIENCES: 'Experiences',
  LAB: 'Lab',
};

/** Hub section keys for hierarchical grouping */
export const HUB_SECTIONS = {
  CORE: 'Core',
  CONTROL: 'Control',
  EXPERIENCES: 'Experiences',
  LAB: 'Lab',
};

/**
 * Maps internal route IDs to domain and hub section.
 * @type {Record<string, { domain: string; section: string; labelKey?: string }>}
 */
export const ROUTE_TO_DOMAIN = {
  simulation: { domain: DOMAINS.WORLD, section: HUB_SECTIONS.CORE, labelKey: 'hub.pillars.simulation_title' },
  missioncontrol: { domain: DOMAINS.CONTROL, section: HUB_SECTIONS.CONTROL, labelKey: 'hub.pillars.missioncontrol_title' },
  minigames: { domain: DOMAINS.EXPERIENCES, section: HUB_SECTIONS.EXPERIENCES, labelKey: 'hub.pillars.minigames_title' },
  mysticquest: { domain: DOMAINS.EXPERIENCES, section: HUB_SECTIONS.EXPERIENCES, labelKey: 'hub.pillars.mysticquest_title' },
  docs: { domain: DOMAINS.LAB, section: HUB_SECTIONS.LAB },
  admin: { domain: DOMAINS.LAB, section: HUB_SECTIONS.LAB },
  dobacksoft: { domain: DOMAINS.LAB, section: HUB_SECTIONS.LAB, labelKey: 'hub.pillars.dobacksoft_title' },
  firesimulator: { domain: DOMAINS.LAB, section: HUB_SECTIONS.LAB }, // Special: back to dobacksoft
};

/** Routes that should be wrapped by AppShell (internal ecosystem) */
export const SHELL_ROUTES = [
  'hub',
  'simulation',
  'missioncontrol',
  'minigames',
  'mysticquest',
  'docs',
  'admin',
  'dobacksoft',
];

/** Routes that stay outside AppShell (entry points, special flows) */
export const NON_SHELL_ROUTES = ['home', 'landing', 'firesimulator'];

/** All valid route IDs for hash routing */
export const VALID_ROUTES = [
  ...SHELL_ROUTES,
  ...NON_SHELL_ROUTES,
];

/** Get domain for a route */
export function getDomainForRoute(routeId) {
  return ROUTE_TO_DOMAIN[routeId]?.domain ?? null;
}

/** Get hub section for a route */
export function getSectionForRoute(routeId) {
  return ROUTE_TO_DOMAIN[routeId]?.section ?? HUB_SECTIONS.LAB;
}

/** Get breadcrumb trail for a route */
export function getBreadcrumbsForRoute(routeId) {
  const meta = ROUTE_TO_DOMAIN[routeId];
  if (!meta) return ['Hub'];
  return ['Hub', meta.domain];
}
