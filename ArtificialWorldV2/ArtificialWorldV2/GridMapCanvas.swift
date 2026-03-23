import AWAgent
import AWDomain
import SwiftUI

/// Mapa scrolleable y zoomable: terreno, agentes con burbujas de pensamiento, tap para perfil.
struct GridMapCanvas: View {
    @Bindable var session: V2WorldSession

    @State private var zoom: CGFloat = 1.0
    @State private var steadyZoom: CGFloat = 1.0

    /// Tamaño base de celda — grande para que los agentes sean bien visibles.
    private let baseCellSize: CGFloat = 48

    private var zoomRange: ClosedRange<CGFloat> { 0.35 ... 4.0 }

    var body: some View {
        GeometryReader { geo in
            let cellSize = baseCellSize * zoom
            let mapSize = CGFloat(session.side) * cellSize

            ZStack(alignment: .topTrailing) {
                ScrollViewReader { proxy in
                    ScrollView([.horizontal, .vertical], showsIndicators: true) {
                        ZStack(alignment: .topLeading) {
                            // Ancla: refugio del controlado (o el primero).
                            let scrollHome = session.mapScrollAnchorHome
                            Color.clear
                                .frame(width: 1, height: 1)
                                .offset(x: CGFloat(scrollHome.x) * cellSize, y: CGFloat(scrollHome.y) * cellSize)
                                .id("refugeScrollAnchor")

                            // Terrain + refugios (uno por agente) + agentes
                            Canvas { context, _ in
                                drawTerrain(context: context, cellSize: cellSize)
                                drawForageHints(context: context, cellSize: cellSize)
                                for coord in session.refugeCellsOnMap {
                                    drawRefugeHouseAt(context: context, cellSize: cellSize, origin: coord)
                                }
                                drawGridLines(context: context, cellSize: cellSize)
                                drawAgents(context: context, cellSize: cellSize)
                            }
                            .allowsHitTesting(false)

                            ForEach(session.agents) { agent in
                                refugeOwnerLabel(agent: agent, cellSize: cellSize)
                                    .allowsHitTesting(false)
                            }

                            // Thought bubbles (SwiftUI overlays)
                            ForEach(session.agents) { agent in
                                AgentMapBubble(
                                    agent: agent,
                                    cellSize: cellSize,
                                    directive: currentDirective(for: agent),
                                    isControlled: agent.id == session.controlledId
                                )
                                .allowsHitTesting(false)
                            }

                            // Resource pickup floating indicators
                            ForEach(session.recentPickups) { pickup in
                                pickupIndicator(pickup: pickup, cellSize: cellSize)
                                    .allowsHitTesting(false)
                                    .transition(.opacity)
                            }

                            // Tap layer
                            Color.clear
                                .contentShape(Rectangle())
                                .onTapGesture { location in
                                    handleTap(at: location, cellSize: cellSize)
                                }
                        }
                        .frame(width: mapSize, height: mapSize)
                        .id("mapContent")
                    }
                    .simultaneousGesture(
                        MagnifyGesture()
                            .onChanged { value in
                                let newZoom = steadyZoom * value.magnification
                                zoom = min(max(newZoom, zoomRange.lowerBound), zoomRange.upperBound)
                            }
                            .onEnded { _ in
                                steadyZoom = zoom
                            }
                    )
                    .onAppear {
                        applyIdealZoom(geo: geo)
                        DispatchQueue.main.async {
                            proxy.scrollTo("refugeScrollAnchor", anchor: .topLeading)
                        }
                    }
                    .onChange(of: session.side) { _, _ in
                        applyIdealZoom(geo: geo)
                    }
                    .onChange(of: session.controlledId) { _, _ in
                        DispatchQueue.main.async {
                            proxy.scrollTo("refugeScrollAnchor", anchor: .center)
                        }
                    }
                }

                mapZoomChrome(geo: geo)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.08), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.12), radius: 8, x: 0, y: 4)
        .accessibilityLabel(
            String(
                format: String(localized: "map.a11y.label_fmt"),
                locale: .current,
                session.side,
                session.side
            )
        )
        .accessibilityHint(String(localized: "map.a11y.hint"))
    }

    // MARK: - Zoom UI

    private func applyIdealZoom(geo: GeometryProxy) {
        let visibleCells: CGFloat = 6
        let idealZoom = geo.size.width / (visibleCells * baseCellSize)
        let z = min(max(idealZoom, zoomRange.lowerBound), zoomRange.upperBound)
        zoom = z
        steadyZoom = z
    }

    private func mapZoomChrome(geo: GeometryProxy) -> some View {
        VStack(alignment: .trailing, spacing: 6) {
            Text(String(format: "%.0f%%", Double(zoom) * 100))
                .font(.caption2.monospacedDigit().weight(.semibold))
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(.ultraThinMaterial, in: Capsule())

            VStack(spacing: 4) {
                Button {
                    nudgeZoom(by: 0.15, geo: geo)
                } label: {
                    Image(systemName: "plus.magnifyingglass")
                        .font(.body.weight(.semibold))
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
                .accessibilityLabel(String(localized: "map.zoom.increase_a11y"))

                Button {
                    nudgeZoom(by: -0.15, geo: geo)
                } label: {
                    Image(systemName: "minus.magnifyingglass")
                        .font(.body.weight(.semibold))
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                .accessibilityLabel(String(localized: "map.zoom.decrease_a11y"))

                Button {
                    applyIdealZoom(geo: geo)
                } label: {
                    Image(systemName: "arrow.counterclockwise.circle")
                        .font(.body.weight(.semibold))
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                .accessibilityLabel(String(localized: "map.zoom.reset_a11y"))
                .help(String(localized: "map.zoom.reset_help"))
            }
            .padding(6)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .padding(8)
    }

    private func nudgeZoom(by delta: CGFloat, geo: GeometryProxy) {
        let newZoom = min(max(steadyZoom + delta, zoomRange.lowerBound), zoomRange.upperBound)
        zoom = newZoom
        steadyZoom = newZoom
    }

    // MARK: - Drawing

    private func drawTerrain(context: GraphicsContext, cellSize: CGFloat) {
        for y in 0 ..< session.side {
            for x in 0 ..< session.side {
                let coord = GridCoord(x: x, y: y)
                guard let terrain = session.gridMap[coord] else { continue }
                let rect = CGRect(
                    x: CGFloat(x) * cellSize,
                    y: CGFloat(y) * cellSize,
                    width: cellSize,
                    height: cellSize
                )
                context.fill(Path(rect), with: .color(terrain.mapSwiftUIColor))
            }
        }
    }

    /// Indicadores decorativos (no son inventario real): marcan celdas donde puede haber forraje.
    private func drawForageHints(context: GraphicsContext, cellSize: CGFloat) {
        let seed = session.worldSeed
        for y in 0 ..< session.side {
            for x in 0 ..< session.side {
                let coord = GridCoord(x: x, y: y)
                guard let terrain = session.gridMap[coord], terrain.resourceDropChance > 0 else { continue }
                let h = forageCellHash(x: x, y: y, seed: seed)
                // ~55% de las celdas “recolectables” muestran pista (resto queda solo el color de bioma).
                if h % 20 >= 11 { continue }

                let rect = CGRect(
                    x: CGFloat(x) * cellSize,
                    y: CGFloat(y) * cellSize,
                    width: cellSize,
                    height: cellSize
                )
                let dotR = max(2.2, cellSize * 0.09)
                let jx = CGFloat(Int(h % 5) - 2) * (cellSize * 0.07)
                let jy = CGFloat(Int((h / 5) % 5) - 2) * (cellSize * 0.07)
                let cx = rect.midX + jx
                let cy = rect.midY + jy
                let dotRect = CGRect(x: cx - dotR, y: cy - dotR, width: dotR * 2, height: dotR * 2)
                let isFiber = (h & 1) == 0
                let color = isFiber
                    ? Color.brown.opacity(0.72)
                    : Color.orange.opacity(0.78)
                context.fill(Path(ellipseIn: dotRect), with: .color(color))
            }
        }
    }

    private func forageCellHash(x: Int, y: Int, seed: UInt64) -> UInt64 {
        var u = UInt64(x) &* 0x9E37_79B9_7F4A_7C15
        u ^= UInt64(y) &* 0xBF58_476D_2CE2_EC63
        u ^= seed
        u &*= 0xC2B2_AE3D_27D4_EB4F
        u ^= u >> 33
        return u
    }

    /// Casa isométrica en una celda refugio.
    private func drawRefugeHouseAt(context: GraphicsContext, cellSize: CGFloat, origin: GridCoord) {
        let rx = CGFloat(origin.x) * cellSize
        let ry = CGFloat(origin.y) * cellSize
        let w = cellSize
        let h = cellSize
        let pad = w * 0.06

        // Parcela / césped bajo la casa
        let lot = CGRect(x: rx + pad * 0.5, y: ry + pad * 0.5, width: w - pad, height: h - pad)
        context.fill(
            Path(roundedRect: lot, cornerRadius: w * 0.08),
            with: .color(Color(red: 0.32, green: 0.62, blue: 0.32))
        )

        // Sombra de la casa
        let shadowRect = CGRect(x: rx + w * 0.14, y: ry + h * 0.58, width: w * 0.72, height: h * 0.28)
        context.fill(
            Path(ellipseIn: shadowRect),
            with: .color(.black.opacity(0.22))
        )

        // Muros (cuerpo)
        let wallTop = ry + h * 0.38
        let wallHeight = h * 0.48
        let wallRect = CGRect(x: rx + w * 0.14, y: wallTop, width: w * 0.72, height: wallHeight)
        context.fill(
            Path(roundedRect: wallRect, cornerRadius: w * 0.04),
            with: .color(Color(red: 0.90, green: 0.78, blue: 0.62))
        )
        context.stroke(
            Path(roundedRect: wallRect, cornerRadius: w * 0.04),
            with: .color(Color(red: 0.55, green: 0.42, blue: 0.30).opacity(0.55)),
            lineWidth: max(1, w * 0.025)
        )

        // Techo (triángulo)
        var roof = Path()
        let roofPeak = CGPoint(x: rx + w * 0.5, y: ry + h * 0.14)
        let roofL = CGPoint(x: rx + w * 0.08, y: wallTop + pad * 0.2)
        let roofR = CGPoint(x: rx + w * 0.92, y: wallTop + pad * 0.2)
        roof.move(to: roofL)
        roof.addLine(to: roofPeak)
        roof.addLine(to: roofR)
        roof.closeSubpath()
        context.fill(roof, with: .color(Color(red: 0.78, green: 0.30, blue: 0.24)))
        context.stroke(roof, with: .color(Color(red: 0.45, green: 0.18, blue: 0.14)), lineWidth: max(1, w * 0.02))

        // Chimenea
        let chim = CGRect(x: rx + w * 0.62, y: ry + h * 0.20, width: w * 0.14, height: h * 0.22)
        context.fill(
            Path(roundedRect: chim, cornerRadius: 2),
            with: .color(Color(red: 0.48, green: 0.45, blue: 0.42))
        )

        // Ventana con cruz
        let winSize = w * 0.18
        let winRect = CGRect(x: wallRect.minX + w * 0.1, y: wallTop + h * 0.08, width: winSize, height: winSize)
        context.fill(
            Path(roundedRect: winRect, cornerRadius: 3),
            with: .color(Color(red: 0.65, green: 0.85, blue: 0.98).opacity(0.92))
        )
        context.stroke(
            Path(roundedRect: winRect, cornerRadius: 3),
            with: .color(.white.opacity(0.85)),
            lineWidth: 1.2
        )
        var cross = Path()
        cross.move(to: CGPoint(x: winRect.midX, y: winRect.minY + 2))
        cross.addLine(to: CGPoint(x: winRect.midX, y: winRect.maxY - 2))
        cross.move(to: CGPoint(x: winRect.minX + 2, y: winRect.midY))
        cross.addLine(to: CGPoint(x: winRect.maxX - 2, y: winRect.midY))
        context.stroke(cross, with: .color(Color(red: 0.35, green: 0.50, blue: 0.62)), lineWidth: 1)

        // Puerta
        let doorW = w * 0.2
        let doorH = h * 0.24
        let door = CGRect(x: wallRect.midX - doorW / 2, y: wallRect.maxY - doorH - pad * 0.3, width: doorW, height: doorH)
        context.fill(
            Path(roundedRect: door, cornerRadius: 3),
            with: .color(Color(red: 0.38, green: 0.24, blue: 0.14))
        )
        let knob = CGRect(x: door.maxX - door.width * 0.28, y: door.midY - 1.5, width: 3, height: 3)
        context.fill(Path(ellipseIn: knob), with: .color(Color(red: 0.85, green: 0.70, blue: 0.35)))

        // Aro de “base” para destacar en el mapa
        let glowRect = CGRect(x: rx - 3, y: ry - 3, width: w + 6, height: h + 6)
        context.stroke(
            Path(roundedRect: glowRect, cornerRadius: w * 0.1),
            with: .color(.yellow.opacity(0.5)),
            lineWidth: 3
        )
    }

    private func refugeOwnerLabel(agent: V2GridAgent, cellSize: CGFloat) -> some View {
        VStack(spacing: 2) {
            Image(systemName: "house.and.flag.fill")
                .font(.system(size: max(12, cellSize * 0.38)))
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.55), radius: 2, x: 0, y: 1)
            Text(agent.displayName)
                .font(.system(size: max(7, cellSize * 0.18), weight: .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.65), radius: 2, x: 0, y: 1)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(.black.opacity(0.35), in: Capsule())
        .frame(maxWidth: cellSize * 2.2)
        .position(
            x: (CGFloat(agent.homeRefuge.x) + 0.5) * cellSize,
            y: CGFloat(agent.homeRefuge.y) * cellSize - cellSize * 0.42
        )
    }

    private func drawGridLines(context: GraphicsContext, cellSize: CGFloat) {
        let totalSize = CGFloat(session.side) * cellSize
        let gridStride = session.side <= 32 ? 4 : 8
        for g in stride(from: 0, through: session.side, by: gridStride) {
            let pos = CGFloat(g) * cellSize
            var v = Path()
            v.move(to: CGPoint(x: pos, y: 0))
            v.addLine(to: CGPoint(x: pos, y: totalSize))
            context.stroke(v, with: .color(.secondary.opacity(0.18)), lineWidth: 1)
            var h = Path()
            h.move(to: CGPoint(x: 0, y: pos))
            h.addLine(to: CGPoint(x: totalSize, y: pos))
            context.stroke(h, with: .color(.secondary.opacity(0.18)), lineWidth: 1)
        }
    }

    private func drawAgents(context: GraphicsContext, cellSize: CGFloat) {
        for agent in session.agents {
            let r = cellSize * 0.4
            let cx = (CGFloat(agent.position.x) + 0.5) * cellSize
            let cy = (CGFloat(agent.position.y) + 0.5) * cellSize
            let rect = CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2)

            // Agent circle
            context.fill(
                Path(ellipseIn: rect),
                with: .color(
                    Color(hue: agent.hue, saturation: 0.85, brightness: 0.95)
                )
            )

            // Controlled agent: golden ring + glow
            if agent.id == session.controlledId {
                let outerRect = rect.insetBy(dx: -4, dy: -4)
                context.stroke(
                    Path(ellipseIn: outerRect),
                    with: .color(.yellow),
                    lineWidth: 3
                )
                // Glow effect
                let glowRect = rect.insetBy(dx: -6, dy: -6)
                context.stroke(
                    Path(ellipseIn: glowRect),
                    with: .color(.yellow.opacity(0.3)),
                    lineWidth: 4
                )
            }

            // Danger indicator: red ring if vitals critical
            let inDanger = agent.vitals.hunger > 0.7 || agent.vitals.energy < 0.25
            if inDanger && agent.id != session.controlledId {
                let dangerRect = rect.insetBy(dx: -3, dy: -3)
                context.stroke(
                    Path(ellipseIn: dangerRect),
                    with: .color(.red.opacity(0.7)),
                    lineWidth: 2
                )
            }
        }
    }

    // MARK: - Pickup Indicators

    private func pickupIndicator(pickup: ResourcePickupEvent, cellSize: CGFloat) -> some View {
        let icon = pickup.kind == "fibra" ? "leaf.fill" : "pill.fill"
        let color: Color = pickup.kind == "fibra" ? .brown : .cyan
        return HStack(spacing: 2) {
            Image(systemName: icon)
                .font(.system(size: max(10, cellSize * 0.3)))
            Text("+1")
                .font(.system(size: max(8, cellSize * 0.25), weight: .bold))
        }
        .foregroundStyle(color)
        .shadow(color: .black.opacity(0.5), radius: 2)
        .position(
            x: (CGFloat(pickup.position.x) + 0.5) * cellSize,
            y: (CGFloat(pickup.position.y) - 0.3) * cellSize
        )
    }

    // MARK: - Interaction

    private func handleTap(at location: CGPoint, cellSize: CGFloat) {
        let cx = Int(location.x / cellSize)
        let cy = Int(location.y / cellSize)
        guard cx >= 0, cy >= 0, cx < session.side, cy < session.side else { return }

        // Find agent within tap radius (2 cells tolerance for fat finger)
        let tapRadius = 2
        var closest: V2GridAgent?
        var closestDist = Int.max
        for agent in session.agents {
            let dx = abs(agent.position.x - cx)
            let dy = abs(agent.position.y - cy)
            let dist = dx + dy
            if dist <= tapRadius && dist < closestDist {
                closest = agent
                closestDist = dist
            }
        }

        if let agent = closest {
            session.selectAgent(id: agent.id)
            session.profileSheetRoute = ProfileSheetRoute(id: agent.id)
        }
    }

    // MARK: - Directive

    private func currentDirective(for agent: V2GridAgent) -> UtilityDirective? {
        let ctx = session.makeContext(for: agent)
        return UtilitySafetyRules.chooseDirective(context: ctx)
    }
}
