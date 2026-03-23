import Foundation

/// Rasgos de personalidad que modulan el scoring de utilidad por agente.
/// Cada agente nace con pesos distintos → decisiones diferentes ante los mismos vitales.
public struct AgentPersonality: Equatable, Sendable, Codable {
    /// Multiplicador sobre el peso de captura (> 1 = más agresivo, < 1 = más pasivo).
    public var aggressiveness: Double
    /// Multiplicador sobre el peso de exploración (> 1 = más curioso, < 1 = más sedentario).
    public var curiosity: Double
    /// Multiplicador sobre el radio de huida ante hostiles (> 1 = más miedoso, < 1 = más valiente).
    public var caution: Double
    /// Multiplicador sobre la tasa de drenaje de energía al explorar (> 1 = se cansa rápido, < 1 = resistente).
    public var metabolismRate: Double

    public init(
        aggressiveness: Double = 1.0,
        curiosity: Double = 1.0,
        caution: Double = 1.0,
        metabolismRate: Double = 1.0
    ) {
        self.aggressiveness = aggressiveness
        self.curiosity = curiosity
        self.caution = caution
        self.metabolismRate = metabolismRate
    }

    /// Personalidad neutra (comportamiento original sin modificar).
    public static let neutral = AgentPersonality()

    /// Arquetipos predefinidos para garantizar diversidad visible en cada partida.
    public static let archetypes: [AgentPersonality] = [
        // Cazador: agresivo, poco curioso, valiente, metabolismo alto
        AgentPersonality(aggressiveness: 2.2, curiosity: 0.4, caution: 0.5, metabolismRate: 1.4),
        // Explorador: poco agresivo, muy curioso, cautela media, metabolismo bajo
        AgentPersonality(aggressiveness: 0.3, curiosity: 2.5, caution: 0.8, metabolismRate: 0.6),
        // Cauteloso: agresividad baja, curiosidad baja, muy cauto, metabolismo normal
        AgentPersonality(aggressiveness: 0.5, curiosity: 0.6, caution: 2.0, metabolismRate: 0.9),
        // Intrépido: alto todo excepto cautela
        AgentPersonality(aggressiveness: 1.8, curiosity: 1.8, caution: 0.3, metabolismRate: 1.3),
        // Resistente: equilibrado pero metabolismo muy bajo — aguanta mucho explorando
        AgentPersonality(aggressiveness: 0.8, curiosity: 1.2, caution: 1.0, metabolismRate: 0.4),
        // Oportunista: moderadamente agresivo, curioso, poco cauto
        AgentPersonality(aggressiveness: 1.5, curiosity: 1.5, caution: 0.6, metabolismRate: 1.0),
        // Ermitaño: baja agresividad, curiosidad media-alta, muy cauto, lento metabolismo
        AgentPersonality(aggressiveness: 0.2, curiosity: 1.4, caution: 1.8, metabolismRate: 0.5),
    ]

    /// Selecciona un arquetipo por índice (cíclico) con ligera variación aleatoria.
    public static func archetype<R: RandomNumberGenerator>(index: Int, using rng: inout R) -> AgentPersonality {
        let base = archetypes[index % archetypes.count]
        let jitter = 0.1
        return AgentPersonality(
            aggressiveness: max(0.1, base.aggressiveness + Double.random(in: -jitter...jitter, using: &rng)),
            curiosity: max(0.1, base.curiosity + Double.random(in: -jitter...jitter, using: &rng)),
            caution: max(0.1, base.caution + Double.random(in: -jitter...jitter, using: &rng)),
            metabolismRate: max(0.2, base.metabolismRate + Double.random(in: -jitter...jitter, using: &rng))
        )
    }

    /// Genera una personalidad aleatoria (fallback para más de 7 agentes).
    public static func random<R: RandomNumberGenerator>(using rng: inout R) -> AgentPersonality {
        AgentPersonality(
            aggressiveness: Double.random(in: 0.3...2.2, using: &rng),
            curiosity: Double.random(in: 0.3...2.5, using: &rng),
            caution: Double.random(in: 0.3...2.0, using: &rng),
            metabolismRate: Double.random(in: 0.4...1.4, using: &rng)
        )
    }

    /// Nombre legible del arquetipo dominante.
    public var archetypeLabel: String {
        if aggressiveness > 1.5 && curiosity < 0.8 {
            return "Cazador"
        } else if curiosity > 1.5 && aggressiveness < 0.8 {
            return "Explorador"
        } else if caution > 1.5 {
            return "Cauteloso"
        } else if metabolismRate < 0.6 {
            return "Resistente"
        } else if aggressiveness > 1.3 && curiosity > 1.3 {
            return "Intrépido"
        } else if aggressiveness < 0.5 && caution > 1.2 {
            return "Ermitaño"
        } else if aggressiveness > 1.2 && curiosity > 1.2 && caution < 0.8 {
            return "Oportunista"
        } else {
            return "Equilibrado"
        }
    }
}
