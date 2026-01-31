import Foundation
import SwiftUI

// MARK: - Recipe Model
struct Recipe: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let category: RecipeCategory
    let prepTime: Int // in minutes
    let ingredients: [String]
    let instructions: [String]
    let macros: MacroNutrients
    let imageUrl: String
    let userId: String? // nil for global recipes
    let isGlobal: Bool
    let createdAt: Date
    let updatedAt: Date

    private enum CodingKeys: String, CodingKey {
        case id = "_id"
        case title, description, category, prepTime
        case ingredients, instructions, macros, imageUrl
        case userId, isGlobal, createdAt, updatedAt
    }

    // MARK: - Computed Properties
    var isUserCreated: Bool {
        return userId != nil && !isGlobal
    }

    var formattedPrepTime: String {
        if prepTime < 60 {
            return "\(prepTime) min"
        } else {
            let hours = prepTime / 60
            let minutes = prepTime % 60
            if minutes == 0 {
                return "\(hours)h"
            } else {
                return "\(hours)h \(minutes)m"
            }
        }
    }

    var totalMacros: Double {
        return macros.protein + macros.carbs + macros.fat
    }
}

// MARK: - Recipe Category
enum RecipeCategory: String, Codable, CaseIterable {
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
}

// MARK: - Macro Nutrients
struct MacroNutrients: Codable {
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double

    var proteinCalories: Double {
        return protein * 4
    }

    var carbsCalories: Double {
        return carbs * 4
    }

    var fatCalories: Double {
        return fat * 9
    }

    var totalMacroCalories: Double {
        return proteinCalories + carbsCalories + fatCalories
    }

    var proteinPercentage: Double {
        return calories > 0 ? (proteinCalories / calories) * 100 : 0
    }

    var carbsPercentage: Double {
        return calories > 0 ? (carbsCalories / calories) * 100 : 0
    }

    var fatPercentage: Double {
        return calories > 0 ? (fatCalories / calories) * 100 : 0
    }

    func formattedCalories() -> String {
        return String(format: "%.0f cal", calories)
    }

    func formattedProtein() -> String {
        return String(format: "%.1fg protein", protein)
    }

    func formattedCarbs() -> String {
        return String(format: "%.1fg carbs", carbs)
    }

    func formattedFat() -> String {
        return String(format: "%.1fg fat", fat)
    }
}

// MARK: - Recipe Extensions
extension Recipe {
    // Sample recipes for development/testing
    static var sampleRecipes: [Recipe] {
        return [
            Recipe(
                id: "1",
                title: "Healthy Chicken Bowl",
                description: "A nutritious and delicious chicken bowl with quinoa and vegetables",
                category: .lunch,
                prepTime: 25,
                ingredients: [
                    "1 chicken breast",
                    "1 cup quinoa",
                    "1 cup broccoli",
                    "1 avocado",
                    "2 tbsp olive oil",
                    "Salt and pepper to taste"
                ],
                instructions: [
                    "Cook quinoa according to package instructions",
                    "Season and grill chicken breast until cooked through",
                    "Steam broccoli until tender",
                    "Slice avocado",
                    "Combine all ingredients in a bowl and drizzle with olive oil"
                ],
                macros: MacroNutrients(calories: 450, protein: 35, carbs: 45, fat: 12),
                imageUrl: "https://via.placeholder.com/400x300?text=Chicken+Bowl",
                userId: nil,
                isGlobal: true,
                createdAt: Date(),
                updatedAt: Date()
            ),
            Recipe(
                id: "2",
                title: "Berry Protein Smoothie",
                description: "A refreshing smoothie packed with protein and antioxidants",
                category: .breakfast,
                prepTime: 5,
                ingredients: [
                    "1 cup mixed berries",
                    "1 banana",
                    "1 scoop protein powder",
                    "1 cup almond milk",
                    "1 tbsp honey",
                    "Ice cubes"
                ],
                instructions: [
                    "Add all ingredients to blender",
                    "Blend until smooth",
                    "Pour into glass and enjoy"
                ],
                macros: MacroNutrients(calories: 320, protein: 25, carbs: 35, fat: 8),
                imageUrl: "https://via.placeholder.com/400x300?text=Berry+Smoothie",
                userId: nil,
                isGlobal: true,
                createdAt: Date(),
                updatedAt: Date()
            )
        ]
    }
}