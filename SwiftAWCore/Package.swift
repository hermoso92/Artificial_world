// swift-tools-version: 6.0
// Artificial World — núcleo Swift (sin SpriteKit). Ver docs/AW_FASE0_AUDITORIA_Y_ARQUITECTURA.md

import PackageDescription

let package = Package(
    name: "SwiftAWCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "AWDomain", targets: ["AWDomain"]),
        .library(name: "AWAgent", targets: ["AWAgent"]),
        .library(name: "AWPersistence", targets: ["AWPersistence"]),
    ],
    targets: [
        .target(name: "AWDomain"),
        .target(name: "AWAgent", dependencies: ["AWDomain"]),
        .target(name: "AWPersistence", dependencies: ["AWDomain"]),
        .testTarget(name: "AWDomainTests", dependencies: ["AWDomain"]),
        .testTarget(name: "AWAgentTests", dependencies: ["AWAgent"]),
        .testTarget(name: "AWPersistenceTests", dependencies: ["AWPersistence"]),
    ]
)
