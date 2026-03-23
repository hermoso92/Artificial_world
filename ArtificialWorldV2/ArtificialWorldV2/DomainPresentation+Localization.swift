import AWAgent
import AWDomain
import Foundation

// MARK: - Biomes (AWDomain catalog stays stable; UI reads strings from app String Catalog)

extension TerrainBiomeDefinition {
    /// Localized title for pickers and HUD (keyed by `zoneID.raw`).
    var localizedDisplayName: String {
        let key = "biome.name.\(zoneID.raw)"
        return String(localized: String.LocalizationValue(stringLiteral: key))
    }
}

// MARK: - Personality archetypes (same thresholds as `AgentPersonality.archetypeLabel`)

extension AgentPersonality {
    /// Localized archetype name for map bubbles and profile.
    var localizedArchetypeLabel: String {
        if aggressiveness > 1.5 && curiosity < 0.8 {
            return String(localized: "archetype.hunter")
        }
        if curiosity > 1.5 && aggressiveness < 0.8 {
            return String(localized: "archetype.explorer")
        }
        if caution > 1.5 {
            return String(localized: "archetype.cautious")
        }
        if metabolismRate < 0.6 {
            return String(localized: "archetype.hardy")
        }
        if aggressiveness > 1.3 && curiosity > 1.3 {
            return String(localized: "archetype.daredevil")
        }
        if aggressiveness < 0.5 && caution > 1.2 {
            return String(localized: "archetype.hermit")
        }
        if aggressiveness > 1.2 && curiosity > 1.2 && caution < 0.8 {
            return String(localized: "archetype.opportunist")
        }
        return String(localized: "archetype.balanced")
    }
}
