import SwiftUI
import AppKit

@main
struct ShadowDesignerApp: App {
    init() {
        // When launched via `swift run`, the process starts as a background app.
        // This makes it a regular app with a dock icon and brings it to the front.
        NSApplication.shared.setActivationPolicy(.regular)
        NSApplication.shared.activate(ignoringOtherApps: true)
    }

    var body: some Scene {
        WindowGroup("HappyShadows Designer") {
            ContentView()
        }
        .windowResizability(.contentSize)
    }
}
