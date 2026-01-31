import SwiftUI

struct PlanningView: View {
    @StateObject private var viewModel = PlanningViewModel()
    @State private var showingMonthView = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // View Toggle
                viewToggleHeader

                // Calendar Content
                if showingMonthView {
                    MonthlyPlanningView(viewModel: viewModel)
                } else {
                    WeeklyPlanningView(viewModel: viewModel)
                }
            }
            .navigationTitle("Meal Planning")
            .navigationBarTitleDisplayMode(.large)
        }
        .sheet(isPresented: $viewModel.showingAddMeal) {
            AddMealView(viewModel: viewModel)
        }
        .onAppear {
            viewModel.loadMealPlans()
        }
    }

    private var viewToggleHeader: some View {
        HStack {
            Picker("View", selection: $showingMonthView) {
                Text("Week").tag(false)
                Text("Month").tag(true)
            }
            .pickerStyle(.segmented)

            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

struct WeeklyPlanningView: View {
    @ObservedObject var viewModel: PlanningViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Week Navigation
            weekNavigationHeader

            // Days of Week
            weekDaysGrid
        }
        .background(Color(.systemGroupedBackground))
    }

    private var weekNavigationHeader: some View {
        HStack {
            Button(action: { viewModel.navigateToWeek(.previous) }) {
                Image(systemName: "chevron.left")
                    .font(.title2)
                    .foregroundColor(.blue)
            }

            Spacer()

            Text(weekRangeText)
                .font(.headline)
                .fontWeight(.semibold)

            Spacer()

            Button(action: { viewModel.navigateToWeek(.next) }) {
                Image(systemName: "chevron.right")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }

    private var weekDaysGrid: some View {
        ScrollView {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 1), spacing: 16) {
                ForEach(viewModel.currentWeekDates, id: \.self) { date in
                    DayPlanningCard(date: date, viewModel: viewModel)
                }
            }
            .padding()
        }
    }

    private var weekRangeText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        guard let firstDate = viewModel.currentWeekDates.first,
              let lastDate = viewModel.currentWeekDates.last else {
            return ""
        }

        let startText = formatter.string(from: firstDate)
        let endText = formatter.string(from: lastDate)

        return "\(startText) - \(endText)"
    }
}

struct MonthlyPlanningView: View {
    @ObservedObject var viewModel: PlanningViewModel

    var body: some View {
        VStack {
            Text("Monthly View")
                .font(.title)
                .padding()

            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()
        }
    }
}

struct DayPlanningCard: View {
    let date: Date
    @ObservedObject var viewModel: PlanningViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Day Header
            dayHeader

            // Meals Section
            mealsSection

            // Total Calories
            if viewModel.totalCalories(for: date) > 0 {
                totalCaloriesSection
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }

    private var dayHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(dayOfWeek)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text(dayNumber)
                    .font(.title2)
                    .fontWeight(.bold)
            }

            Spacer()

            if isToday {
                Text("Today")
                    .font(.caption)
                    .fontWeight(.medium)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue.opacity(0.2))
                    .foregroundColor(.blue)
                    .cornerRadius(8)
            }
        }
    }

    private var mealsSection: some View {
        VStack(spacing: 8) {
            ForEach(MealType.allCases.sorted(by: { $0.sortOrder < $1.sortOrder }), id: \.self) { mealType in
                MealTypeRow(
                    date: date,
                    mealType: mealType,
                    meals: viewModel.meals(for: date, mealType: mealType),
                    onAddMeal: {
                        viewModel.openAddMeal(for: date, mealType: mealType)
                    }
                )
            }
        }
    }

    private var totalCaloriesSection: some View {
        HStack {
            Text("Total Calories")
                .font(.subheadline)
                .fontWeight(.medium)

            Spacer()

            Text(String(format: "%.0f cal", viewModel.totalCalories(for: date)))
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.green)
        }
        .padding(.top, 8)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color(.systemGray5)),
            alignment: .top
        )
    }

    // MARK: - Computed Properties
    private var dayOfWeek: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: date)
    }

    private var dayNumber: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter.string(from: date)
    }

    private var isToday: Bool {
        Calendar.current.isDateInToday(date)
    }
}

struct MealTypeRow: View {
    let date: Date
    let mealType: MealType
    let meals: [PlannedMeal]
    let onAddMeal: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Meal Type Icon
            Image(systemName: mealType.iconName)
                .font(.title3)
                .foregroundColor(mealType.color)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                Text(mealType.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)

                if meals.isEmpty {
                    Button("Add \(mealType.displayName)") {
                        onAddMeal()
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                } else {
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(meals, id: \.recipe.id) { meal in
                            HStack {
                                Text(meal.recipe.title)
                                    .font(.caption)
                                    .lineLimit(1)

                                if meal.source != .fresh {
                                    Image(systemName: meal.source.iconName)
                                        .font(.caption2)
                                        .foregroundColor(meal.source.color)
                                }
                            }
                        }
                    }
                }
            }

            Spacer()

            if !meals.isEmpty {
                Button(action: onAddMeal) {
                    Image(systemName: "plus.circle")
                        .font(.title3)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddMealView: View {
    @ObservedObject var viewModel: PlanningViewModel
    @Environment(\.dismiss) private var dismiss

    @StateObject private var recipeViewModel = RecipeListViewModel()
    @State private var notes = ""
    @State private var selectedSource: MealSource = .fresh

    var body: some View {
        NavigationView {
            VStack {
                if let mealType = viewModel.selectedMealType {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Add \(mealType.displayName)")
                            .font(.title2)
                            .fontWeight(.bold)

                        Text(formattedDate)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()

                    // Meal Source Picker
                    Picker("Source", selection: $selectedSource) {
                        ForEach(MealSource.allCases, id: \.self) { source in
                            HStack {
                                Image(systemName: source.iconName)
                                Text(source.displayName)
                            }
                            .tag(source)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)

                    // Notes Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notes")
                            .font(.subheadline)
                            .fontWeight(.medium)

                        TextField("Optional notes...", text: $notes, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                    }
                    .padding()

                    // Recipe Selection
                    Text("Choose Recipe")
                        .font(.headline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)

                    if recipeViewModel.isLoading {
                        LoadingView()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 12) {
                                ForEach(recipeViewModel.filteredRecipes) { recipe in
                                    Button(action: {
                                        addMeal(recipe: recipe, mealType: mealType)
                                    }) {
                                        MealRecipeSelectionRow(recipe: recipe)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            recipeViewModel.loadRecipes()
        }
    }

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        return formatter.string(from: viewModel.selectedDate)
    }

    private func addMeal(recipe: Recipe, mealType: MealType) {
        viewModel.addMeal(
            recipe: recipe,
            to: viewModel.selectedDate,
            mealType: mealType,
            notes: notes,
            source: selectedSource
        )
    }
}

struct MealRecipeSelectionRow: View {
    let recipe: Recipe

    var body: some View {
        HStack(spacing: 12) {
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

            VStack(alignment: .leading, spacing: 4) {
                Text(recipe.title)
                    .font(.headline)
                    .fontWeight(.medium)
                    .lineLimit(1)

                HStack {
                    CategoryBadge(category: recipe.category)
                    Spacer()
                }

                HStack {
                    Text(recipe.formattedPrepTime)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text(recipe.macros.formattedCalories())
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}

#Preview {
    PlanningView()
}