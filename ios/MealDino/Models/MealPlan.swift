import Foundation
import SwiftUI

// MARK: - MealPlan Model
struct MealPlan: Codable, Identifiable {
    let id: String
    let date: String // YYYY-MM-DD format
    let meals: [PlannedMeal]
    let cookingSessions: [CookingSession]
    let createdAt: Date
    let updatedAt: Date

    private enum CodingKeys: String, CodingKey {
        case id = "_id"
        case date, meals, cookingSessions, createdAt, updatedAt
    }

    // MARK: - Computed Properties
    var dateValue: Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: date) ?? Date()
    }

    func meals(for mealType: MealType) -> [PlannedMeal] {
        return meals.filter { $0.type == mealType }
    }

    func hasMeal(for mealType: MealType) -> Bool {
        return meals.contains { $0.type == mealType }
    }

    var totalCalories: Double {
        return meals.reduce(0) { $0 + $1.recipe.macros.calories }
    }

    var totalMacros: MacroNutrients {
        let totalCalories = meals.reduce(0.0) { $0 + $1.recipe.macros.calories }
        let totalProtein = meals.reduce(0.0) { $0 + $1.recipe.macros.protein }
        let totalCarbs = meals.reduce(0.0) { $0 + $1.recipe.macros.carbs }
        let totalFat = meals.reduce(0.0) { $0 + $1.recipe.macros.fat }

        return MacroNutrients(
            calories: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat
        )
    }

    var hasContent: Bool {
        return !meals.isEmpty || !cookingSessions.isEmpty
    }

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: dateValue)
    }
}

// MARK: - Planned Meal
struct PlannedMeal: Codable {
    let type: MealType
    let recipe: Recipe
    let notes: String
    let source: MealSource

    var hasNotes: Bool {
        return !notes.isEmpty
    }
}

// MARK: - Meal Type
enum MealType: String, Codable, CaseIterable {
    case breakfast = "breakfast"
    case lunch = "lunch"
    case dinner = "dinner"
    case snack = "snack"

    var displayName: String {
        return rawValue.capitalized
    }

    var iconName: String {
        switch self {
        case .breakfast: return "sunrise.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.fill"
        case .snack: return "heart.fill"
        }
    }

    var color: Color {
        switch self {
        case .breakfast: return .orange
        case .lunch: return .blue
        case .dinner: return .purple
        case .snack: return .pink
        }
    }

    // Order for display purposes
    var sortOrder: Int {
        switch self {
        case .breakfast: return 0
        case .lunch: return 1
        case .dinner: return 2
        case .snack: return 3
        }
    }
}

// MARK: - Meal Source
enum MealSource: String, Codable, CaseIterable {
    case fresh = "fresh"
    case leftovers = "leftovers"
    case mealPrep = "meal_prep"
    case frozen = "frozen"

    var displayName: String {
        switch self {
        case .fresh: return "Fresh"
        case .leftovers: return "Leftovers"
        case .mealPrep: return "Meal Prep"
        case .frozen: return "Frozen"
        }
    }

    var iconName: String {
        switch self {
        case .fresh: return "leaf.fill"
        case .leftovers: return "tray.fill"
        case .mealPrep: return "takeoutbag.and.cup.and.straw.fill"
        case .frozen: return "snowflake"
        }
    }

    var color: Color {
        switch self {
        case .fresh: return .green
        case .leftovers: return .orange
        case .mealPrep: return .blue
        case .frozen: return .cyan
        }
    }
}

// MARK: - Cooking Session
struct CookingSession: Codable {
    let recipe: Recipe
    let notes: String
    let timeSlot: TimeSlot
    let servings: Int
    let purpose: CookingPurpose

    var hasNotes: Bool {
        return !notes.isEmpty
    }

    var formattedServings: String {
        return servings == 1 ? "1 serving" : "\(servings) servings"
    }
}

// MARK: - Time Slot
enum TimeSlot: String, Codable, CaseIterable {
    case morning = "morning"
    case afternoon = "afternoon"
    case evening = "evening"

    var displayName: String {
        return rawValue.capitalized
    }

    var iconName: String {
        switch self {
        case .morning: return "sunrise"
        case .afternoon: return "sun.max"
        case .evening: return "sunset"
        }
    }

    var color: Color {
        switch self {
        case .morning: return .yellow
        case .afternoon: return .orange
        case .evening: return .purple
        }
    }
}

// MARK: - Cooking Purpose
enum CookingPurpose: String, Codable, CaseIterable {
    case mealPrep = "meal_prep"
    case batchCooking = "batch_cooking"
    case weeklyPrep = "weekly_prep"
    case dailyCooking = "daily_cooking"

    var displayName: String {
        switch self {
        case .mealPrep: return "Meal Prep"
        case .batchCooking: return "Batch Cooking"
        case .weeklyPrep: return "Weekly Prep"
        case .dailyCooking: return "Daily Cooking"
        }
    }

    var iconName: String {
        switch self {
        case .mealPrep: return "takeoutbag.and.cup.and.straw"
        case .batchCooking: return "scalemass"
        case .weeklyPrep: return "calendar"
        case .dailyCooking: return "flame"
        }
    }
}

// MARK: - Add Meal Request
struct AddMealRequest: Codable {
    let date: String
    let meal: MealData

    struct MealData: Codable {
        let type: String
        let recipe: String // Recipe ID
        let notes: String
        let source: String
    }
}

// MARK: - Date Utilities
extension Date {
    func toMealPlanDateString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: self)
    }

    var startOfWeek: Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: self)
        return calendar.date(from: components) ?? self
    }

    var endOfWeek: Date {
        let calendar = Calendar.current
        return calendar.date(byAdding: .day, value: 6, to: startOfWeek) ?? self
    }

    func daysInCurrentWeek() -> [Date] {
        let calendar = Calendar.current
        var days: [Date] = []

        let startOfWeek = self.startOfWeek

        for i in 0..<7 {
            if let day = calendar.date(byAdding: .day, value: i, to: startOfWeek) {
                days.append(day)
            }
        }

        return days
    }
}

// MARK: - Sample Data
extension MealPlan {
    static var sampleMealPlan: MealPlan {
        return MealPlan(
            id: "1",
            date: Date().toMealPlanDateString(),
            meals: [
                PlannedMeal(
                    type: .breakfast,
                    recipe: Recipe.sampleRecipes[1], // Berry smoothie
                    notes: "Add extra protein powder",
                    source: .fresh
                ),
                PlannedMeal(
                    type: .lunch,
                    recipe: Recipe.sampleRecipes[0], // Chicken bowl
                    notes: "",
                    source: .mealPrep
                )
            ],
            cookingSessions: [
                CookingSession(
                    recipe: Recipe.sampleRecipes[0],
                    notes: "Prep for 3 days",
                    timeSlot: .afternoon,
                    servings: 6,
                    purpose: .mealPrep
                )
            ],
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}