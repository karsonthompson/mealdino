import SwiftUI

struct CollectionDetailView: View {
    let collectionId: String
    @StateObject private var viewModel = CollectionDetailViewModel()

    var body: some View {
        Group {
            if let collection = viewModel.collection {
                collectionContent(collection)
            } else if viewModel.isLoading {
                LoadingView()
            } else {
                ErrorView(message: viewModel.errorMessage ?? "Collection not found") {
                    viewModel.loadCollection(id: collectionId)
                }
            }
        }
        .onAppear {
            viewModel.loadCollection(id: collectionId)
        }
        .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }

    private func collectionContent(_ collection: Collection) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Collection Header
                collectionHeader(collection)

                // Recipes Grid
                if collection.recipes.isEmpty {
                    emptyCollectionView(collection)
                } else {
                    recipesGrid(collection.recipes)
                }
            }
            .padding()
        }
        .navigationTitle(collection.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Add Recipes") {
                    viewModel.showingAddRecipes = true
                }
            }
        }
        .sheet(isPresented: $viewModel.showingAddRecipes) {
            AddRecipesToCollectionView(viewModel: viewModel)
        }
    }

    private func collectionHeader(_ collection: Collection) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 16) {
                RoundedRectangle(cornerRadius: 16)
                    .fill(collection.colorValue.gradient)
                    .frame(width: 80, height: 80)
                    .overlay {
                        Image(systemName: collection.iconName)
                            .font(.title)
                            .foregroundColor(.white)
                    }

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(collection.name)
                            .font(.title2)
                            .fontWeight(.bold)

                        if collection.isDefault {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                        }
                    }

                    if !collection.description.isEmpty {
                        Text(collection.description)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Text(collection.displayRecipeCount)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }

            if !collection.recipes.isEmpty {
                // Collection Stats
                VStack(spacing: 8) {
                    HStack {
                        Text("Collection Overview")
                            .font(.headline)
                        Spacer()
                    }

                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        StatCard(
                            title: "Recipes",
                            value: "\(collection.recipeCount)",
                            color: .blue
                        )

                        StatCard(
                            title: "Avg Prep Time",
                            value: averagePrepTime(collection.recipes),
                            color: .orange
                        )

                        StatCard(
                            title: "Avg Calories",
                            value: averageCalories(collection.recipes),
                            color: .green
                        )
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
        }
    }

    private func recipesGrid(_ recipes: [Recipe]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recipes")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                ForEach(recipes) { recipe in
                    NavigationLink(destination: RecipeDetailView(recipeId: recipe.id)) {
                        RecipeCard(recipe: recipe)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func emptyCollectionView(_ collection: Collection) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "tray")
                .font(.system(size: 48))
                .foregroundColor(collection.colorValue)

            VStack(spacing: 8) {
                Text("No Recipes Yet")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("Start building your \(collection.name.lowercased()) collection by adding some recipes!")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button("Add Recipes") {
                viewModel.showingAddRecipes = true
            }
            .buttonStyle(.borderedProminent)
            .tint(collection.colorValue)
        }
        .padding(.vertical, 40)
    }

    private func averagePrepTime(_ recipes: [Recipe]) -> String {
        guard !recipes.isEmpty else { return "0m" }
        let average = recipes.map(\.prepTime).reduce(0, +) / recipes.count
        return "\(average)m"
    }

    private func averageCalories(_ recipes: [Recipe]) -> String {
        guard !recipes.isEmpty else { return "0" }
        let average = recipes.map(\.macros.calories).reduce(0, +) / Double(recipes.count)
        return String(format: "%.0f", average)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

struct AddRecipesToCollectionView: View {
    @ObservedObject var viewModel: CollectionDetailViewModel
    @Environment(\.dismiss) private var dismiss

    @StateObject private var recipeViewModel = RecipeListViewModel()
    @State private var selectedRecipeIds: Set<String> = []

    var body: some View {
        NavigationView {
            VStack {
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)

                    TextField("Search recipes...", text: $recipeViewModel.searchText)
                        .textFieldStyle(.plain)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding(.horizontal)

                // Recipe Selection List
                if recipeViewModel.isLoading {
                    LoadingView()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(availableRecipes) { recipe in
                                RecipeSelectionRow(
                                    recipe: recipe,
                                    isSelected: selectedRecipeIds.contains(recipe.id)
                                ) {
                                    toggleRecipeSelection(recipe.id)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Add Recipes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add (\(selectedRecipeIds.count))") {
                        viewModel.addRecipes(Array(selectedRecipeIds))
                    }
                    .disabled(selectedRecipeIds.isEmpty)
                }
            }
        }
        .onAppear {
            recipeViewModel.loadRecipes()
        }
        .onChange(of: viewModel.showingAddRecipes) { isShowing in
            if !isShowing {
                dismiss()
            }
        }
    }

    private var availableRecipes: [Recipe] {
        // Filter out recipes that are already in the collection
        let existingRecipeIds = Set(viewModel.collection?.recipes.map(\.id) ?? [])
        return recipeViewModel.filteredRecipes.filter { !existingRecipeIds.contains($0.id) }
    }

    private func toggleRecipeSelection(_ recipeId: String) {
        if selectedRecipeIds.contains(recipeId) {
            selectedRecipeIds.remove(recipeId)
        } else {
            selectedRecipeIds.insert(recipeId)
        }
    }
}

struct RecipeSelectionRow: View {
    let recipe: Recipe
    let isSelected: Bool
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: 12) {
                // Recipe Image
                AsyncImage(url: URL(string: recipe.imageUrl)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color(.systemGray5))
                }
                .frame(width: 60, height: 60)
                .cornerRadius(8)
                .clipped()

                // Recipe Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(recipe.title)
                        .font(.headline)
                        .fontWeight(.medium)
                        .lineLimit(1)

                    Text(recipe.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)

                    HStack {
                        CategoryBadge(category: recipe.category)
                        Spacer()
                        Text(recipe.formattedPrepTime)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Selection Indicator
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .green : .gray)
                    .font(.title2)
            }
            .padding()
            .background(isSelected ? Color.green.opacity(0.1) : Color(.systemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.green : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    NavigationView {
        CollectionDetailView(collectionId: "1")
    }
}