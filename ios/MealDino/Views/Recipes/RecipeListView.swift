import SwiftUI

struct RecipeListView: View {
    @StateObject private var viewModel = RecipeListViewModel()
    @State private var showingFilters = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                searchBar

                // Category Filter
                if viewModel.selectedCategory != nil {
                    categoryFilterBanner
                }

                // Recipe List
                recipeListContent
            }
            .navigationTitle("Recipes")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Filter") {
                        showingFilters = true
                    }
                }
            }
            .sheet(isPresented: $showingFilters) {
                RecipeFilterView(viewModel: viewModel)
            }
            .refreshable {
                viewModel.refreshRecipes()
            }
        }
        .onAppear {
            if viewModel.recipes.isEmpty {
                viewModel.loadRecipes()
            }
        }
    }

    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)

            TextField("Search recipes...", text: $viewModel.searchText)
                .textFieldStyle(.plain)

            if !viewModel.searchText.isEmpty {
                Button("Clear") {
                    viewModel.searchText = ""
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .padding(.horizontal)
        .padding(.top, 8)
    }

    private var categoryFilterBanner: some View {
        HStack {
            Image(systemName: viewModel.selectedCategory?.iconName ?? "")
                .foregroundColor(viewModel.selectedCategory?.color ?? .gray)

            Text("Filtered by \(viewModel.selectedCategory?.displayName ?? "")")
                .font(.caption)
                .foregroundColor(.secondary)

            Spacer()

            Button("Clear") {
                viewModel.selectedCategory = nil
            }
            .font(.caption)
            .foregroundColor(.blue)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }

    @ViewBuilder
    private var recipeListContent: some View {
        if viewModel.isLoading {
            LoadingView()
        } else if let errorMessage = viewModel.errorMessage {
            ErrorView(message: errorMessage) {
                viewModel.loadRecipes()
            }
        } else if viewModel.filteredRecipes.isEmpty {
            EmptyRecipesView(hasSearchText: !viewModel.searchText.isEmpty)
        } else {
            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    ForEach(viewModel.filteredRecipes) { recipe in
                        NavigationLink(destination: RecipeDetailView(recipeId: recipe.id)) {
                            RecipeCard(recipe: recipe)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
        }
    }
}

struct RecipeCard: View {
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
                            .font(.title)
                    }
            }
            .frame(height: 120)
            .cornerRadius(8)
            .clipped()

            VStack(alignment: .leading, spacing: 4) {
                // Category Badge
                HStack {
                    CategoryBadge(category: recipe.category)
                    Spacer()
                    if recipe.isUserCreated {
                        Image(systemName: "person.badge.plus")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }

                Text(recipe.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .lineLimit(2)

                Text(recipe.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)

                HStack {
                    Label(recipe.formattedPrepTime, systemImage: "clock")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text(recipe.macros.formattedCalories())
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 8)
        }
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

struct CategoryBadge: View {
    let category: RecipeCategory

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: category.iconName)
                .font(.caption2)

            Text(category.displayName)
                .font(.caption2)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(category.color.opacity(0.2))
        .foregroundColor(category.color)
        .cornerRadius(8)
    }
}

struct RecipeFilterView: View {
    @ObservedObject var viewModel: RecipeListViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Filter Recipes")
                    .font(.title2)
                    .fontWeight(.bold)

                VStack(alignment: .leading, spacing: 12) {
                    Text("Category")
                        .font(.headline)

                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        ForEach(RecipeCategory.allCases, id: \.self) { category in
                            Button(action: {
                                viewModel.selectedCategory = viewModel.selectedCategory == category ? nil : category
                            }) {
                                CategoryFilterButton(
                                    category: category,
                                    isSelected: viewModel.selectedCategory == category
                                )
                            }
                        }
                    }
                }

                Spacer()

                Button("Clear All Filters") {
                    viewModel.clearSearch()
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct CategoryFilterButton: View {
    let category: RecipeCategory
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: category.iconName)
                .font(.title2)
                .foregroundColor(isSelected ? .white : category.color)

            Text(category.displayName)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : .primary)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 80)
        .background(isSelected ? category.color : Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct EmptyRecipesView: View {
    let hasSearchText: Bool

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: hasSearchText ? "magnifyingglass" : "book")
                .font(.system(size: 48))
                .foregroundColor(.gray)

            Text(hasSearchText ? "No recipes found" : "No recipes yet")
                .font(.title2)
                .fontWeight(.semibold)

            Text(hasSearchText ? "Try adjusting your search or filters" : "Start by adding your first recipe!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            if !hasSearchText {
                Button("Add Recipe") {
                    // TODO: Navigate to add recipe
                }
                .buttonStyle(.borderedProminent)
                .buttonBorderShape(.roundedRectangle)
            }
        }
        .padding()
    }
}

#Preview {
    RecipeListView()
}