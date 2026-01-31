import SwiftUI

struct RecipeDetailView: View {
    let recipeId: String
    @StateObject private var viewModel = RecipeDetailViewModel()
    @State private var showingShareSheet = false

    var body: some View {
        ScrollView {
            if let recipe = viewModel.recipe {
                VStack(alignment: .leading, spacing: 20) {
                    // Hero Image
                    recipeImageHeader(recipe)

                    VStack(alignment: .leading, spacing: 16) {
                        // Title and Basic Info
                        recipeTitleSection(recipe)

                        // Macronutrients
                        macroNutrientsSection(recipe)

                        // Ingredients
                        ingredientsSection(recipe)

                        // Instructions
                        instructionsSection(recipe)
                    }
                    .padding(.horizontal)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button(action: { viewModel.toggleFavorite() }) {
                    Image(systemName: viewModel.isFavorited ? "heart.fill" : "heart")
                        .foregroundColor(viewModel.isFavorited ? .red : .gray)
                }

                Button(action: { showingShareSheet = true }) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let recipe = viewModel.recipe {
                ShareSheet(activityItems: [shareText(for: recipe)])
            }
        }
        .onAppear {
            viewModel.loadRecipe(id: recipeId)
        }
        .overlay {
            if viewModel.isLoading {
                LoadingView()
            }
        }
        .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }

    private func recipeImageHeader(_ recipe: Recipe) -> some View {
        GeometryReader { geometry in
            AsyncImage(url: URL(string: recipe.imageUrl)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color(.systemGray5))
                    .overlay {
                        ProgressView()
                    }
            }
            .frame(width: geometry.size.width, height: 250)
            .clipped()
        }
        .frame(height: 250)
    }

    private func recipeTitleSection(_ recipe: Recipe) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                CategoryBadge(category: recipe.category)
                Spacer()
                if recipe.isUserCreated {
                    Text("Your Recipe")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.2))
                        .foregroundColor(.blue)
                        .cornerRadius(8)
                }
            }

            Text(recipe.title)
                .font(.title)
                .fontWeight(.bold)

            Text(recipe.description)
                .font(.body)
                .foregroundColor(.secondary)

            HStack(spacing: 20) {
                Label(recipe.formattedPrepTime, systemImage: "clock")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Label("1 serving", systemImage: "person")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }

    private func macroNutrientsSection(_ recipe: Recipe) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Nutrition Facts")
                .font(.headline)
                .fontWeight(.semibold)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                MacroCard(
                    title: "Calories",
                    value: String(format: "%.0f", recipe.macros.calories),
                    unit: "cal",
                    color: .orange
                )

                MacroCard(
                    title: "Protein",
                    value: String(format: "%.1f", recipe.macros.protein),
                    unit: "g",
                    color: .red
                )

                MacroCard(
                    title: "Carbs",
                    value: String(format: "%.1f", recipe.macros.carbs),
                    unit: "g",
                    color: .blue
                )

                MacroCard(
                    title: "Fat",
                    value: String(format: "%.1f", recipe.macros.fat),
                    unit: "g",
                    color: .green
                )
            }

            // Macro Percentages
            VStack(spacing: 8) {
                HStack {
                    Text("Macro Breakdown")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Spacer()
                }

                HStack(spacing: 4) {
                    Rectangle()
                        .fill(.red)
                        .frame(width: CGFloat(recipe.macros.proteinPercentage) * 3, height: 8)

                    Rectangle()
                        .fill(.blue)
                        .frame(width: CGFloat(recipe.macros.carbsPercentage) * 3, height: 8)

                    Rectangle()
                        .fill(.green)
                        .frame(width: CGFloat(recipe.macros.fatPercentage) * 3, height: 8)

                    Spacer()
                }
                .cornerRadius(4)

                HStack {
                    Label(String(format: "%.0f%% Protein", recipe.macros.proteinPercentage), systemImage: "circle.fill")
                        .labelStyle(MacroLabelStyle(color: .red))

                    Spacer()

                    Label(String(format: "%.0f%% Carbs", recipe.macros.carbsPercentage), systemImage: "circle.fill")
                        .labelStyle(MacroLabelStyle(color: .blue))

                    Spacer()

                    Label(String(format: "%.0f%% Fat", recipe.macros.fatPercentage), systemImage: "circle.fill")
                        .labelStyle(MacroLabelStyle(color: .green))
                }
                .font(.caption)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func ingredientsSection(_ recipe: Recipe) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ingredients")
                .font(.headline)
                .fontWeight(.semibold)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(recipe.ingredients.enumerated()), id: \.offset) { index, ingredient in
                    HStack(alignment: .top, spacing: 12) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                            .padding(.top, 8)

                        Text(ingredient)
                            .font(.body)
                            .fixedSize(horizontal: false, vertical: true)

                        Spacer()
                    }
                }
            }
        }
    }

    private func instructionsSection(_ recipe: Recipe) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Instructions")
                .font(.headline)
                .fontWeight(.semibold)

            VStack(alignment: .leading, spacing: 16) {
                ForEach(Array(recipe.instructions.enumerated()), id: \.offset) { index, instruction in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(index + 1)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(width: 28, height: 28)
                            .background(Color.green)
                            .clipShape(Circle())

                        Text(instruction)
                            .font(.body)
                            .fixedSize(horizontal: false, vertical: true)

                        Spacer()
                    }
                }
            }
        }
    }

    private func shareText(for recipe: Recipe) -> String {
        return """
        Check out this recipe: \(recipe.title)

        \(recipe.description)

        Prep Time: \(recipe.formattedPrepTime)
        Calories: \(recipe.macros.formattedCalories())

        Shared from MealDino
        """
    }
}

struct MacroCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
            }

            HStack {
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(value)
                        .font(.title2)
                        .fontWeight(.bold)

                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(color.opacity(0.3), lineWidth: 2)
        )
    }
}

struct MacroLabelStyle: LabelStyle {
    let color: Color

    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 4) {
            configuration.icon
                .foregroundColor(color)
            configuration.title
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    NavigationView {
        RecipeDetailView(recipeId: "1")
    }
}