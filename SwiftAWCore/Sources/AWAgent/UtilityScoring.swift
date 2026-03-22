import AWDomain
import Foundation

/// Scoring fino cuando no hay directiva forzada (Fase 3). Complementa `UtilitySafetyRules`.
public enum UtilityScoring {
    /// Penalización mínima a captura cuando la memoria registra intención explícita de explorar.
    private static let preferExploreCapturePenalty = 0.012
    /// Tras varios ticks seguidos explorando deambulando, sube levemente la urgencia de captura.
    private static let exploreStreakCaptureNudge = 0.08

    /// En exploración: balance entre buscar capturas y deambular (ahorra encuentros hostiles implícitos).
    public static func chooseExploringDirective(
        context: UtilityContext,
        curves: ExploringUtilityCurves = .default
    ) -> UtilityDirective {
        let hMapped = curves.hunger.evaluate(context.vitals.hunger)
        let eMapped = curves.energy.evaluate(context.vitals.energy)

        var captureWeight = hMapped * 1.35 + (1 - eMapped) * 0.35
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
        let exploreWeight = eMapped * 0.45 + (1 - hMapped) * 0.55
        return captureWeight >= exploreWeight ? .captureNearest : .explore
    }
}
