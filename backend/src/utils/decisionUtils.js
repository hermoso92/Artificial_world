/**
 * Utilidades para normalizar entradas de memoria de decisiones.
 */

/**
 * Construye una entrada de decision normalizada.
 * @param {object} opts - { ts?, title, chosen, rationale?, impact? }
 * @returns {object} Entrada con ts, title, chosen, rationale, impact
 */
export function buildDecisionEntry(opts) {
  const ts = opts.ts ?? new Date().toISOString();
  return {
    ts,
    title: opts.title ?? '',
    chosen: opts.chosen ?? opts.decision ?? '',
    rationale: opts.rationale ?? null,
    impact: opts.impact ?? null,
  };
}
