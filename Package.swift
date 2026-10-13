// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "HappyShadows",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
        .tvOS(.v17),
        .watchOS(.v10),
        .visionOS(.v1),
    ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "HappyShadows",
            targets: ["HappyShadows"]
        ),
    ],
    targets: [
        .target(
            name: "HappyShadows",
            dependencies: []
        ),
        .executableTarget(
            name: "ShadowDesigner",
            dependencies: ["HappyShadows"],
            path: "ShadowDesigner",
            exclude: ["Assets.xcassets", "ShadowDesigner.xcodeproj", "ShadowDesigner.entitlements", "project.yml", "generate-icon.swift"]
        ),
        .testTarget(
            name: "HappyShadowsTests",
            dependencies: ["HappyShadows"],
            // README images and the shared Swift/TS fixture are read from the
            // source tree (#filePath), not bundled as resources.
            exclude: ["Exports", "Fixtures"]
        ),
    ]
)
