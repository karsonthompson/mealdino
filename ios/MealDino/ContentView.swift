import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthenticationService

    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                AuthenticationView()
            }
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }

            RecipeListView()
                .tabItem {
                    Image(systemName: "book.fill")
                    Text("Recipes")
                }

            CollectionListView()
                .tabItem {
                    Image(systemName: "folder.fill")
                    Text("Collections")
                }

            PlanningView()
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Plan")
                }

            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profile")
                }
        }
        .accentColor(Color(.systemGreen))
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationService())
        .environmentObject(APIClient.shared)
}