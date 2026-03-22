/// Control manual, automático (IA) o híbrido (misma simulación, distinta fuente de intención).
public enum PlayerControlMode: String, Sendable, Codable, CaseIterable {
    case manual
    case autonomous
    case hybrid
}
