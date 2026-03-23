import AWAgent
import AWDomain
import SwiftUI

/// Burbuja de pensamiento + nombre sobre cada agente en el mapa.
struct AgentMapBubble: View {
    let agent: V2GridAgent
    let cellSize: CGFloat
    let directive: UtilityDirective?
    let isControlled: Bool

    var body: some View {
        VStack(spacing: 1) {
            // Thought bubble with directive icon
            if let directive {
                HStack(spacing: 3) {
                    directiveIcon(directive)
                        .font(.system(size: max(10, cellSize * 0.28)))
                    Text(directiveLabel(directive))
                        .font(.system(size: max(7, cellSize * 0.2), weight: .semibold))
                        .lineLimit(1)
                }
                .foregroundStyle(directiveColor(directive))
                .padding(.horizontal, 5)
                .padding(.vertical, 2)
                .background(
                    Capsule()
                        .fill(.ultraThinMaterial)
                        .shadow(color: .black.opacity(0.25), radius: 2, y: 1)
                )
            }

            // Agent name + archetype
            VStack(spacing: 0) {
                Text(agent.displayName)
                    .font(.system(size: max(8, cellSize * 0.25), weight: isControlled ? .bold : .medium))
                    .foregroundStyle(isControlled ? .yellow : .white)
                Text(agent.personality.localizedArchetypeLabel)
                    .font(.system(size: max(6, cellSize * 0.18), weight: .regular))
                    .foregroundStyle(.white.opacity(0.7))
            }
            .shadow(color: .black.opacity(0.7), radius: 2, x: 0, y: 1)
            .lineLimit(1)

            // Compact energy bar
            energyBar
        }
        .position(
            x: (CGFloat(agent.position.x) + 0.5) * cellSize,
            y: CGFloat(agent.position.y) * cellSize - cellSize * 0.45
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(agentAccessibilityLabel)
        .accessibilityAddTraits(isControlled ? .isSelected : [])
        .accessibilityHint(String(localized: "agent.a11y.map_hint"))
        .accessibilitySortPriority(isControlled ? 100 : 0)
    }

    private var agentAccessibilityLabel: String {
        let control = isControlled ? String(localized: "agent.a11y.controlled_prefix") : ""
        let pos = String(
            format: String(localized: "agent.a11y.row_col_fmt"),
            locale: .current,
            agent.position.y,
            agent.position.x
        )
        let e = Int((agent.vitals.energy * 100).rounded(.towardZero))
        let h = Int((agent.vitals.hunger * 100).rounded(.towardZero))
        let vitals = String(
            format: String(localized: "agent.a11y.vitals_fmt"),
            locale: .current,
            e,
            h
        )
        let intent: String
        if let d = directive {
            intent = String(
                format: String(localized: "agent.a11y.intent_fmt"),
                locale: .current,
                directiveLabel(d)
            )
        } else {
            intent = ""
        }
        let arch = String(
            format: String(localized: "agent.a11y.archetype_fmt"),
            locale: .current,
            agent.personality.localizedArchetypeLabel
        )
        return "\(control)\(agent.displayName). \(pos)\(vitals)\(intent)\(arch)"
    }

    // MARK: - Energy Bar

    private var energyBar: some View {
        ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 2)
                .fill(Color.black.opacity(0.3))
            RoundedRectangle(cornerRadius: 2)
                .fill(energyBarColor)
                .frame(width: max(0, cellSize * 0.6 * agent.vitals.energy))
        }
        .frame(width: cellSize * 0.6, height: max(2, cellSize * 0.08))
    }

    private var energyBarColor: Color {
        if agent.vitals.energy < 0.25 {
            return .red
        } else if agent.vitals.energy < 0.5 {
            return .orange
        } else {
            return .green
        }
    }

    // MARK: - Directive Visuals

    @ViewBuilder
    private func directiveIcon(_ directive: UtilityDirective) -> some View {
        switch directive {
        case .explore:
            Image(systemName: "safari")
        case .captureNearest:
            Image(systemName: "scope")
        case .returnToRefuge:
            Image(systemName: "house.fill")
        case .rest:
            Image(systemName: "moon.zzz.fill")
        case .consumeNutrient:
            Image(systemName: "leaf.fill")
        }
    }

    private func directiveColor(_ directive: UtilityDirective) -> Color {
        switch directive {
        case .explore: .blue
        case .captureNearest: .red
        case .returnToRefuge: .green
        case .rest: .purple
        case .consumeNutrient: .orange
        }
    }

    private func directiveLabel(_ directive: UtilityDirective) -> String {
        switch directive {
        case .explore: String(localized: "directive.short.explore")
        case .captureNearest: String(localized: "directive.short.captureNearest")
        case .returnToRefuge: String(localized: "directive.short.returnToRefuge")
        case .rest: String(localized: "directive.short.rest")
        case .consumeNutrient: String(localized: "directive.short.consumeNutrient")
        }
    }
}
