import AWDomain
import Foundation

/// Scoring fino cuando no hay directiva forzada (Fase 3). Complementa `UtilitySafetyRules`.
public enum UtilityScoring {
    /// Penalización mínima a captura cuando la memoria registra intención explícita de explorar.
    private static let preferExploreCapturePenalty = 0.012
    /// Tras varios ticks seguidos explorando deambulando, sube levemente la urgencia de captura.
    private static let exploreStreakCaptureNudge = 0.08

    /// En exploración: balance entre buscar capturas, deambular, y volver voluntariamente al refugio.
    /// Con personalidades extremas los resultados divergen mucho (un Cazador caza, un Explorador explora, un Cauteloso vuelve).
    public static func chooseExploringDirective(
        context: UtilityContext,
        curves: ExploringUtilityCurves = .default
    ) -> UtilityDirective {
        let hMapped = curves.hunger.evaluate(context.vitals.hunger)
        let eMapped = curves.energy.evaluate(context.vitals.energy)

        let personality = context.personality

        // --- Captura ---
        var captureWeight = hMapped * 1.35 + (1 - eMapped) * 0.35
        captureWeight *= personality.aggressiveness
        if let inv = context.inventory {
            if inv.nutrientPackets > 0 {
                captureWeight -= 0.35 * Double(min(inv.nutrientPackets, 4))
            }
            if inv.fiberScraps > 5 {
                captureWeight += 0.08
            }
        }
        if context.memory?.prefersExploreFromEvents == true {
            captureWeight -= Self.preferExploreCapturePenalty
        }
        if let mem = context.memory,
           mem.lastExploringDirective == .explore,
           mem.consecutiveExploringSameChoice >= 3
        {
            captureWeight += Self.exploreStreakCaptureNudge
        }

        // --- Exploración ---
        var exploreWeight = eMapped * 0.45 + (1 - hMapped) * 0.55
        exploreWeight *= personality.curiosity
        // Paso 6 — con vitales holgados, un empujón leve a salir de la rutina refugio/explorar repetitiva.
        if context.vitals.energy > 0.72, context.vitals.hunger < 0.38 {
            exploreWeight += 0.06
        }

        // --- Retorno voluntario (no forzado) al refugio ---
        // Agentes cautelosos prefieren volver antes; intrépidos aguantan más
        var returnWeight = 0.0
        if context.vitals.energy < 0.4 {
            returnWeight += (0.4 - context.vitals.energy) * 2.0
        }
        if context.vitals.hunger > 0.6 {
            returnWeight += (context.vitals.hunger - 0.6) * 2.0
        }
        returnWeight *= personality.caution

        // Elegir la directiva con mayor peso
        if returnWeight > captureWeight && returnWeight > exploreWeight {
            return .returnToRefuge
        }
        return captureWeight >= exploreWeight ? .captureNearest : .explore
    }
}
