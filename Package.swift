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
            dependencies: ["HappyShadows"]
        ),
        .testTarget(
            name: "HappyShadowsTests",
            dependencies: ["HappyShadows"]
        ),
    ]
)
