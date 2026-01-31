# MealDino Data Models

## Overview
This document defines the data models for the MealDino iOS app, based on the existing MongoDB schemas. These models should be implemented as Swift structs/classes with Codable conformance for API communication and Core Data integration for offline storage.

---

## Recipe Model

### Swift Implementation
```swift
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
}

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
}

struct MacroNutrients: Codable {
    let calories: Double
    let protein: Double
    let carbs: Double
    let fat: Double

    var totalMacros: Double {
        return protein + carbs + fat
    }

    var proteinPercentage: Double {
        return totalMacros > 0 ? (protein * 4) / calories * 100 : 0
    }

    var carbsPercentage: Double {
        return totalMacros > 0 ? (carbs * 4) / calories * 100 : 0
    }

    var fatPercentage: Double {
        return totalMacros > 0 ? (fat * 9) / calories * 100 : 0
    }
}
```

### MongoDB Schema Reference
- `_id`: ObjectId (mapped to String in Swift)
- `userId`: ObjectId reference to User (nullable for global recipes)
- `isGlobal`: Boolean flag for recipes available to all users
- `title`: String (max 100 characters)
- `description`: String (max 500 characters)
- `category`: Enum ['breakfast', 'lunch', 'dinner', 'snack']
- `prepTime`: Number (minutes)
- `ingredients`: Array of strings
- `instructions`: Array of strings
- `macros`: Embedded object with calories, protein, carbs, fat
- `imageUrl`: String (default placeholder provided)
- `timestamps`: createdAt, updatedAt

---

## Collection Model

### Swift Implementation
```swift
struct Collection: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let color: String // Hex color string
    let isDefault: Bool
    let recipeCount: Int
    let recipes: [Recipe]
    let createdAt: Date
    let updatedAt: Date

    private enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, description, color, isDefault
        case recipeCount, recipes, createdAt, updatedAt
    }

    var colorValue: Color {
        return Color(hex: color) ?? .green
    }

    var iconName: String {
        return isDefault ? "heart.fill" : "folder.fill"
    }
}

// Helper extension for hex color conversion
extension Color {
    init?(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

### MongoDB Schema Reference
- `userId`: ObjectId reference to User (required)
- `name`: String (max 50 characters, unique per user)
- `description`: String (max 200 characters, optional)
- `color`: String (hex color, default '#10B981')
- `isDefault`: Boolean (auto-created collections like 'Favorites')
- `recipes`: Array of ObjectId references to Recipe
- `sortOrder`: Number (for ordering collections)
- Virtual `recipeCount`: Calculated field for number of recipes

---

## MealPlan Model

### Swift Implementation
```swift
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

    var dateValue: Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: date) ?? Date()
    }

    func meals(for mealType: MealType) -> [PlannedMeal] {
        return meals.filter { $0.type == mealType }
    }

    var totalCalories: Double {
        return meals.reduce(0) { $0 + $1.recipe.macros.calories }
    }
}

struct PlannedMeal: Codable {
    let type: MealType
    let recipe: Recipe
    let notes: String
    let source: MealSource
}

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
}

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
}

struct CookingSession: Codable {
    let recipe: Recipe
    let notes: String
    let timeSlot: TimeSlot
    let servings: Int
    let purpose: CookingPurpose
}

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
}

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
}
```

### MongoDB Schema Reference
- `userId`: ObjectId reference to User (required)
- `date`: String in YYYY-MM-DD format (unique per user)
- `meals`: Array of embedded meal objects
- `cookingSessions`: Array of embedded cooking session objects
- Each meal has: type (enum), recipe (ObjectId ref), notes (string), source (enum)
- Each session has: recipe (ObjectId ref), notes, timeSlot, servings, purpose

---

## User Authentication Model

### Swift Implementation
```swift
struct User: Codable, Identifiable {
    let id: String
    let name: String?
    let email: String?
    let image: String?
    let emailVerified: Date?

    private enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, email, image, emailVerified
    }
}

struct AuthSession: Codable {
    let user: User?
    let expires: Date?
    let accessToken: String?

    var isValid: Bool {
        guard let expires = expires else { return false }
        return expires > Date()
    }
}
```

---

## API Response Models

### Swift Implementation
```swift
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let message: String?
    let count: Int?
    let error: String?
}

struct APIError: Codable, Error {
    let success: Bool
    let message: String
    let error: String?

    var localizedDescription: String {
        return message
    }
}
```

---

## Core Data Integration

For offline functionality, these models should be mirrored in Core Data with the following considerations:

1. **Recipe Entity**: Store full recipe data for offline viewing
2. **Collection Entity**: Store collection metadata and recipe relationships
3. **MealPlan Entity**: Store meal plans for offline meal planning
4. **User Entity**: Store basic user info for offline display

### Sync Strategy
- **Fetch-first**: Always try to fetch from API, fall back to Core Data
- **Background sync**: Sync changes when app becomes active
- **Conflict resolution**: API data takes precedence over local data
- **Cache expiration**: Implement cache TTL for better data freshness

---

## Validation Rules

### Recipe Validation
- Title: 1-100 characters
- Description: 1-500 characters
- PrepTime: 1-999 minutes
- Ingredients: At least 1 ingredient
- Instructions: At least 1 instruction step
- Macros: All values >= 0

### Collection Validation
- Name: 1-50 characters, unique per user
- Description: 0-200 characters
- Color: Valid hex color format

### MealPlan Validation
- Date: Valid YYYY-MM-DD format
- Meals: Valid meal type and recipe reference
- Cooking Sessions: Valid time slot and recipe reference