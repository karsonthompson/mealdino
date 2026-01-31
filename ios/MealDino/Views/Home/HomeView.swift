import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authService: AuthenticationService
    @StateObject private var recipeViewModel = RecipeListViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Header
                    welcomeHeader

                    // Quick Actions
                    quickActionsSection

                    // Featured Recipes
                    featuredRecipesSection

                    // Recent Activity
                    recentActivitySection
                }
                .padding()
            }
            .navigationTitle("MealDino")
            .refreshable {
                recipeViewModel.refreshRecipes()
            }
        }
        .onAppear {
            if recipeViewModel.recipes.isEmpty {
                recipeViewModel.loadRecipes()
            }
        }
    }

    private var welcomeHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Welcome back,")
                    .font(.title2)
                    .foregroundColor(.secondary)

                Text(authService.user?.displayName ?? "Chef")
                    .font(.title)
                    .fontWeight(.bold)
            }

            Spacer()

            // Profile Picture Placeholder
            Circle()
                .fill(Color.green.gradient)
                .frame(width: 50, height: 50)
                .overlay {
                    Text(authService.user?.initials ?? "MD")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
        }
    }

    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .fontWeight(.semibold)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                QuickActionCard(
                    title: "Add Recipe",
                    icon: "plus.circle.fill",
                    color: .green
                ) {
                    // TODO: Navigate to add recipe
                }

                QuickActionCard(
                    title: "Plan Meal",
                    icon: "calendar.badge.plus",
                    color: .blue
                ) {
                    // TODO: Navigate to meal planning
                }
            }
        }
    }

    private var featuredRecipesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Featured Recipes")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Button("See All") {
                    // TODO: Navigate to recipes tab
                }
                .font(.subheadline)
                .foregroundColor(.green)
            }

            if recipeViewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: 16) {
                        ForEach(Array(recipeViewModel.recipes.prefix(5))) { recipe in
                            FeaturedRecipeCard(recipe: recipe)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.horizontal, -16)
            }
        }
    }

    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.headline)
                .fontWeight(.semibold)

            VStack(spacing: 8) {
                RecentActivityItem(
                    title: "Added to Favorites",
                    subtitle: "Healthy Chicken Bowl",
                    icon: "heart.fill",
                    color: .red,
                    time: "2h ago"
                )

                RecentActivityItem(
                    title: "Planned for Tomorrow",
                    subtitle: "Berry Protein Smoothie",
                    icon: "calendar",
                    color: .blue,
                    time: "5h ago"
                )

                RecentActivityItem(
                    title: "Created Recipe",
                    subtitle: "Quinoa Salad",
                    icon: "plus.circle",
                    color: .green,
                    time: "1d ago"
                )
            }
        }
    }
}

struct QuickActionCard: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title)
                    .foregroundColor(color)

                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

struct FeaturedRecipeCard: View {
    let recipe: Recipe

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Recipe Image
            AsyncImage(url: URL(string: recipe.imageUrl)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color(.systemGray5))
                    .overlay {
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    }
            }
            .frame(width: 160, height: 120)
            .cornerRadius(8)
            .clipped()

            VStack(alignment: .leading, spacing: 4) {
                Text(recipe.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(2)

                HStack {
                    Image(systemName: "clock")
                        .foregroundColor(.secondary)

                    Text(recipe.formattedPrepTime)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text(recipe.macros.formattedCalories())
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(width: 160)
    }
}

struct RecentActivityItem: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let time: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(time)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    HomeView()
        .environmentObject(AuthenticationService())
        .environmentObject(APIClient.shared)
}