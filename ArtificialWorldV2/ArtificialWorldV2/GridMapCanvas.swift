import AWDomain
import SwiftUI

/// Mapa discreto: terreno por celda, refugio destacado, agentes como círculos; tap para elegir control.
struct GridMapCanvas: View {
    @Bindable var session: V2WorldSession

    var body: some View {
        GeometryReader { geo in
            let side = CGFloat(session.side)
            let cell = min(geo.size.width, geo.size.height) / side
            ZStack(alignment: .topLeading) {
                Canvas { context, _ in
                    for y in 0 ..< session.side {
                        for x in 0 ..< session.side {
                            let coord = GridCoord(x: x, y: y)
                            guard let terrain = session.gridMap[coord] else { continue }
                            let rect = CGRect(
                                x: CGFloat(x) * cell,
                                y: CGFloat(y) * cell,
                                width: cell,
                                height: cell
                            )
                            context.fill(Path(rect), with: .color(terrain.mapSwiftUIColor))
                        }
                    }
                    let gridStride = session.side <= 32 ? 4 : 8
                    for g in stride(from: 0, through: session.side, by: gridStride) {
                        let gx = CGFloat(g) * cell
                        var v = Path()
                        v.move(to: CGPoint(x: gx, y: 0))
                        v.addLine(to: CGPoint(x: gx, y: side * cell))
                        context.stroke(v, with: .color(.secondary.opacity(0.18)), lineWidth: 1)
                        var h = Path()
                        h.move(to: CGPoint(x: 0, y: gx))
                        h.addLine(to: CGPoint(x: side * cell, y: gx))
                        context.stroke(h, with: .color(.secondary.opacity(0.18)), lineWidth: 1)
                    }
                    for agent in session.agents {
                        let r = cell * 0.38
                        let cx = (CGFloat(agent.position.x) + 0.5) * cell
                        let cy = (CGFloat(agent.position.y) + 0.5) * cell
                        let rect = CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2)
                        context.fill(
                            Path(ellipseIn: rect),
                            with: .color(
                                Color(
                                    hue: agent.hue,
                                    saturation: 0.78,
                                    brightness: 0.92
                                )
                            )
                        )
                        if agent.id == session.controlledId {
                            context.stroke(
                                Path(ellipseIn: rect.insetBy(dx: -3, dy: -3)),
                                with: .color(.white),
                                lineWidth: 2.5
                            )
                        }
                    }
                }
                .allowsHitTesting(false)

                Color.clear
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onEnded { value in
                                let point = value.location
                                let c = min(geo.size.width, geo.size.height) / CGFloat(session.side)
                                let cx = Int(point.x / c)
                                let cy = Int(point.y / c)
                                guard cx >= 0, cy >= 0, cx < session.side, cy < session.side else { return }
                                if let ag = session.agents.first(where: { $0.position.x == cx && $0.position.y == cy }) {
                                    session.selectAgent(id: ag.id)
                                }
                            }
                    )
            }
            .frame(width: side * cell, height: side * cell)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .aspectRatio(1, contentMode: .fit)
    }
}
