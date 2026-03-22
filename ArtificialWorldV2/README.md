# Artificial World V2 (iOS)

Cliente **nuevo** para el juego: grid compartido, varios agentes con utilidad, **cambio de control en vivo**. Convive con [`ArtificialWorld/`](../ArtificialWorld/) (vertical slice + sync) sin reemplazarlo todavía.

## Abrir en Xcode

```text
ArtificialWorldV2/ArtificialWorldV2.xcodeproj
```

- **iOS 17+**, Swift 6, mismo `SwiftAWCore` local (`../SwiftAWCore`).
- **Bundle ID:** `com.antoniohermoso.artificialworld.v2`
- **Signing:** `Config/Signing.xcconfig` (incluye el de V1 + `Local.xcconfig` opcional aquí).

## Build (CI / terminal)

Desde la raíz del monorepo:

```bash
xcodebuild build \
  -project ArtificialWorldV2/ArtificialWorldV2.xcodeproj \
  -scheme ArtificialWorldV2 \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO
```

## Estado actual (iteración)

- **`V2WorldSession`**: grid **según dispositivo** — `GameWorldBlueprint.resolvedGridSideCells()`: **32×32** en iPhone, **64×64** en iPad (y targets “grandes” tipo TV / vision / Catalyst). **6 agentes**, refugio **(0,0)**.
- **Tick**: drenaje / descanso + movimiento IA con **`UtilitySafetyRules`** + **`UtilityScoring`** (`AWAgent`) según contexto por agente.
- **Control**: `PlayerControlMode` — **manual** (solo el elegido se mueve con el D-pad; el resto sigue con IA), **autónomo** (todos con IA), **híbrido** (IA del controlado solo si hay directiva forzada de seguridad).
- **UI**: `GridMapCanvas` (SwiftUI `Canvas`), tap en celda para cambiar agente controlado; pestañas **Partida** / **Acerca**.

## Próximo trabajo (orden sugerido)

1. Recursos en celdas (no solo “perseguir al otro”), combate/captura al compartir celda, inventario que reaccione al mapa.
2. Cámara / zoom para 128×128 o overrides manuales sin depender solo del idiom.
3. Persistencia SQLite + sync `SyncEnvelopeV1` cuando el estado sea estable.
