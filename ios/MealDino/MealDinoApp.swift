import SwiftUI

@main
struct MealDinoApp: App {
    @StateObject private var authService = AuthenticationService()
    @StateObject private var apiClient = APIClient.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
                .environmentObject(apiClient)
        }
    }
}