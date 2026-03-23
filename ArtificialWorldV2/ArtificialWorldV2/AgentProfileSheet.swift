import AWAgent
import AWDomain
import SwiftUI

/// Sheet de ficha de agente: vitales, inventario, directiva, registro en vivo.
struct AgentProfileSheet: View {
    @Bindable var session: V2WorldSession
    let agentId: UUID
    let onTakeControl: () -> Void
    let onDismiss: () -> Void

    private var agent: V2GridAgent? {
        session.agents.first { $0.id == agentId }
    }

    private var context: UtilityContext? {
        guard let agent else { return nil }
        return session.makeContext(for: agent)
    }

    private var isControlled: Bool {
        agentId == session.controlledId
    }

    var body: some View {
        NavigationStack {
            Group {
                if let agent, let context {
                    ScrollView {
                        VStack(spacing: 20) {
                            headerSection(agent: agent)
                            personalitySection(agent: agent)
                            directiveSection(agent: agent, context: context)
                            activityLogSection
                            vitalsSection(agent: agent)
                            inventorySection(agent: agent)
                            locationSection(context: context)
                            memorySection(agent: agent)
                        }
                        .padding()
                    }
                    .navigationTitle(agent.displayName)
                } else {
                    ContentUnavailableView(
                        String(localized: "profile.not_found_title"),
                        systemImage: "person.slash",
                        description: Text(String(localized: "profile.not_found_desc"))
                    )
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "Cerrar")) { onDismiss() }
                }
                ToolbarItem(placement: .primaryAction) {
                    if !isControlled {
                        Button(String(localized: "profile.take_control")) { onTakeControl() }
                            .fontWeight(.semibold)
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Header

    private func headerSection(agent: V2GridAgent) -> some View {
        HStack(spacing: 14) {
            Circle()
                .fill(Color(hue: agent.hue, saturation: 0.85, brightness: 0.95))
                .frame(width: 48, height: 48)
                .overlay {
                    if isControlled {
                        Circle()
                            .strokeBorder(.yellow, lineWidth: 3)
                    }
                }
                .shadow(color: Color(hue: agent.hue, saturation: 0.5, brightness: 0.8).opacity(0.5), radius: 6)

            VStack(alignment: .leading, spacing: 4) {
                Text(agent.displayName)
                    .font(.title2.bold())

                HStack(spacing: 6) {
                    if isControlled {
                        Label(String(localized: "profile.controlled_badge"), systemImage: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundStyle(.yellow)
                    }
                    Text("(\(agent.position.x), \(agent.position.y))")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                Text(
                    String(
                        format: String(localized: "profile.refuge_coords_fmt"),
                        locale: .current,
                        agent.homeRefuge.x,
                        agent.homeRefuge.y
                    )
                )
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.tertiary)
            }

            Spacer()
        }
    }

    // MARK: - Personality

    private func personalitySection(agent: V2GridAgent) -> some View {
        let p = agent.personality
        return GroupBox {
            VStack(spacing: 10) {
                HStack {
                    Text(p.localizedArchetypeLabel)
                        .font(.subheadline.bold())
                        .foregroundStyle(.primary)
                    Spacer()
                }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    traitBar(label: String(localized: "profile.trait.aggressiveness"), value: p.aggressiveness, icon: "flame.fill", color: .red)
                    traitBar(label: String(localized: "profile.trait.curiosity"), value: p.curiosity, icon: "binoculars.fill", color: .blue)
                    traitBar(label: String(localized: "profile.trait.caution"), value: p.caution, icon: "shield.fill", color: .yellow)
                    traitBar(label: String(localized: "profile.trait.metabolism"), value: p.metabolismRate, icon: "hare.fill", color: .green)
                }
            }
        } label: {
            Label(String(localized: "profile.personality_title"), systemImage: "person.fill.questionmark")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }

    private func traitBar(label: String, value: Double, icon: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                    .foregroundStyle(color)
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(String(format: "%.1f", value))
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            // Map 0.1–2.5 range to 0–1 for display
            let normalized = min(1, max(0, (value - 0.1) / 2.4))
            ProgressView(value: normalized)
                .tint(color)
        }
    }

    // MARK: - Directive

    private func directiveSection(agent: V2GridAgent, context: UtilityContext) -> some View {
        let directive = resolvedDirective(context: context)
        return GroupBox {
            HStack(spacing: 12) {
                directiveIcon(directive)
                    .font(.title2)
                    .foregroundStyle(directiveColor(directive))
                    .frame(width: 36, height: 36)
                    .background(directiveColor(directive).opacity(0.15))
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(directiveName(directive))
                        .font(.headline)
                    Text(directiveDescription(directive))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }
        } label: {
            Label(String(localized: "profile.current_action_title"), systemImage: "brain.head.profile")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Vitals

    // MARK: - Activity log (tiempo real)

    private var activityLogSection: some View {
        GroupBox {
            let rows = session.activityLog(for: agentId)
            if rows.isEmpty {
                Text(String(localized: "profile.activity_empty"))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                // Sin ScrollView anidado dentro del ScrollView principal (evita cuelgues en iOS).
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(Array(rows.prefix(50))) { entry in
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text(
                                String(
                                    format: String(localized: "profile.activity_tick_fmt"),
                                    locale: .current,
                                    entry.tick
                                )
                            )
                                .font(.caption2.monospacedDigit())
                                .foregroundStyle(.tertiary)
                                .frame(width: 56, alignment: .leading)
                            Text(entry.line)
                                .font(.caption)
                                .foregroundStyle(.primary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        } label: {
            Label(String(localized: "profile.activity_log_title"), systemImage: "list.bullet.rectangle")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }

    private func vitalsSection(agent: V2GridAgent) -> some View {
        GroupBox {
            VStack(spacing: 12) {
                vitalRow(
                    label: String(localized: "profile.vital_energy"),
                    value: agent.vitals.energy,
                    icon: "bolt.fill",
                    color: agent.vitals.energy < 0.25 ? .red : agent.vitals.energy < 0.5 ? .orange : .green
                )
                vitalRow(
                    label: String(localized: "profile.vital_hunger"),
                    value: agent.vitals.hunger,
                    icon: "fork.knife",
                    color: agent.vitals.hunger > 0.7 ? .red : agent.vitals.hunger > 0.5 ? .orange : .blue,
                    inverted: true
                )
            }
        } label: {
            Label(String(localized: "profile.vitals_title"), systemImage: "heart.fill")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }

    private func vitalRow(label: String, value: Double, icon: String, color: Color, inverted: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(label)
                    .font(.subheadline.weight(.medium))
                Spacer()
                Text("\(Int(value * 100))%")
                    .font(.subheadline.monospacedDigit().weight(.semibold))
                    .foregroundStyle(color)
            }
            ProgressView(value: value)
                .tint(color)
        }
    }

    // MARK: - Inventory

    private func inventorySection(agent: V2GridAgent) -> some View {
        GroupBox {
            HStack(spacing: 20) {
                inventoryItem(icon: "leaf.fill", label: String(localized: "profile.inv_fiber"), count: agent.inventory.fiberScraps, color: .brown)
                inventoryItem(icon: "pill.fill", label: String(localized: "profile.inv_nutrients"), count: agent.inventory.nutrientPackets, color: .cyan)
            }
        } label: {
            Label(String(localized: "profile.inventory_title"), systemImage: "bag.fill")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }

    private func inventoryItem(icon: String, label: String, count: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text("\(count)")
                .font(.title3.monospacedDigit().bold())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Location

    private func locationSection(context: UtilityContext) -> some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: presenceIcon(for: context))
                        .foregroundStyle(presenceColor(for: context))
                    Text(presenceLabel(for: context))
                        .font(.subheadline)
                    Spacer()
                }
                if session.agents.count < 2 {
                    Text(String(localized: "profile.single_agent"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else if let dist = context.nearestHostileDistance {
                    let d = Int(dist.rounded(.towardZero))
                    HStack {
                        Image(systemName: dist < 12 ? "exclamationmark.triangle.fill" : "eye.fill")
                            .foregroundStyle(dist < 12 ? .red : .secondary)
                        Text(
                            String(
                                format: String(localized: "profile.cells_from_nearest_fmt"),
                                locale: .current,
                                d
                            )
                        )
                            .font(.subheadline)
                            .foregroundStyle(dist < 12 ? .red : .primary)
                        Spacer()
                    }
                    Text(proximityLegend(distance: d))
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .lineLimit(3)
                        .minimumScaleFactor(0.85)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        } label: {
            Label(String(localized: "profile.location_title"), systemImage: "map.fill")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }

    /// Guía breve (pantallas chicas): distancia Manhattan vs utilidad/huida.
    private func proximityLegend(distance: Int) -> String {
        if distance <= 2 {
            return String(localized: "profile.proximity_very_close")
        }
        if distance < 12 {
            return String(localized: "profile.proximity_medium")
        }
        return String(localized: "profile.proximity_far")
    }

    private func presenceIcon(for context: UtilityContext) -> String {
        switch context.presence {
        case .insideRefuge: "house.fill"
        case .exploring: "figure.walk"
        }
    }

    private func presenceColor(for context: UtilityContext) -> Color {
        switch context.presence {
        case .insideRefuge: .green
        case .exploring: .blue
        }
    }

    private func presenceLabel(for context: UtilityContext) -> String {
        switch context.presence {
        case .insideRefuge: String(localized: "profile.presence.refuge")
        case .exploring: String(localized: "profile.presence.exploring")
        }
    }

    // MARK: - Memory

    private func memorySection(agent: V2GridAgent) -> some View {
        GroupBox {
            if agent.memory.summary.notableEvents.isEmpty {
                Text(String(localized: "profile.memory_empty"))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(Array(agent.memory.summary.notableEvents.suffix(5).enumerated()), id: \.offset) { _, event in
                        HStack(spacing: 8) {
                            Image(systemName: eventIcon(event))
                                .font(.caption)
                                .foregroundStyle(eventColor(event))
                                .frame(width: 16)
                            Text(eventLabel(event))
                                .font(.caption)
                        }
                    }
                }
            }

            if agent.memory.consecutiveExploringSameChoice > 1, let dir = agent.memory.lastExploringDirective {
                HStack(spacing: 4) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .font(.caption)
                        .foregroundStyle(.blue)
                    Text(
                        String(
                            format: String(localized: "profile.memory_streak_fmt"),
                            locale: .current,
                            directiveName(dir),
                            agent.memory.consecutiveExploringSameChoice
                        )
                    )
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 4)
            }
        } label: {
            Label(String(localized: "profile.memory_title"), systemImage: "brain")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Helpers

    private func resolvedDirective(context: UtilityContext) -> UtilityDirective {
        UtilitySafetyRules.chooseDirective(context: context)
    }

    @ViewBuilder
    private func directiveIcon(_ directive: UtilityDirective) -> some View {
        switch directive {
        case .explore: Image(systemName: "safari")
        case .captureNearest: Image(systemName: "scope")
        case .returnToRefuge: Image(systemName: "house.fill")
        case .rest: Image(systemName: "moon.zzz.fill")
        case .consumeNutrient: Image(systemName: "leaf.fill")
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

    private func directiveName(_ directive: UtilityDirective) -> String {
        switch directive {
        case .explore: String(localized: "directive.name.explore")
        case .captureNearest: String(localized: "directive.name.captureNearest")
        case .returnToRefuge: String(localized: "directive.name.returnToRefuge")
        case .rest: String(localized: "directive.name.rest")
        case .consumeNutrient: String(localized: "directive.name.consumeNutrient")
        }
    }

    private func directiveDescription(_ directive: UtilityDirective) -> String {
        switch directive {
        case .explore: String(localized: "directive.desc.explore")
        case .captureNearest: String(localized: "directive.desc.captureNearest")
        case .returnToRefuge: String(localized: "directive.desc.returnToRefuge")
        case .rest: String(localized: "directive.desc.rest")
        case .consumeNutrient: String(localized: "directive.desc.consumeNutrient")
        }
    }

    private func eventIcon(_ event: String) -> String {
        switch event {
        case AgentMemory.preferExploreEvent: "safari"
        case AgentMemory.perceivedThreatStressEvent: "exclamationmark.triangle.fill"
        default: "circle.fill"
        }
    }

    private func eventColor(_ event: String) -> Color {
        switch event {
        case AgentMemory.preferExploreEvent: .blue
        case AgentMemory.perceivedThreatStressEvent: .red
        default: .secondary
        }
    }

    private func eventLabel(_ event: String) -> String {
        switch event {
        case AgentMemory.preferExploreEvent: String(localized: "profile.event.prefer_explore")
        case AgentMemory.perceivedThreatStressEvent: String(localized: "profile.event.threat_stress")
        default: event
        }
    }
}
