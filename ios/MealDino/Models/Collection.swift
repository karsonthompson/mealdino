import Foundation
import SwiftUI

// MARK: - Collection Model
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

    // MARK: - Computed Properties
    var colorValue: Color {
        return Color(hex: color) ?? .green
    }

    var iconName: String {
        if isDefault && name.lowercased() == "favorites" {
            return "heart.fill"
        }
        return "folder.fill"
    }

    var isEmpty: Bool {
        return recipeCount == 0
    }

    var displayRecipeCount: String {
        return recipeCount == 1 ? "1 recipe" : "\(recipeCount) recipes"
    }
}

// MARK: - Color Extension
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
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    var hexString: String {
        let uic = UIColor(self)
        guard let components = uic.cgColor.components, components.count >= 3 else {
            return "#000000"
        }
        let r = Float(components[0])
        let g = Float(components[1])
        let b = Float(components[2])
        return String(format: "#%02lX%02lX%02lX",
                     lroundf(r * 255),
                     lroundf(g * 255),
                     lroundf(b * 255))
    }
}

// MARK: - Collection Extensions
extension Collection {
    // Predefined colors for collections
    static var predefinedColors: [String] {
        return [
            "#EF4444", // Red
            "#F59E0B", // Amber
            "#10B981", // Emerald
            "#3B82F6", // Blue
            "#8B5CF6", // Violet
            "#EC4899", // Pink
            "#14B8A6", // Teal
            "#F97316"  // Orange
        ]
    }

    // Sample collections for development/testing
    static var sampleCollections: [Collection] {
        return [
            Collection(
                id: "1",
                name: "Favorites",
                description: "Your favorite recipes",
                color: "#EF4444",
                isDefault: true,
                recipeCount: 5,
                recipes: [],
                createdAt: Date(),
                updatedAt: Date()
            ),
            Collection(
                id: "2",
                name: "Quick Meals",
                description: "Meals that take 30 minutes or less",
                color: "#10B981",
                isDefault: false,
                recipeCount: 12,
                recipes: [],
                createdAt: Date(),
                updatedAt: Date()
            ),
            Collection(
                id: "3",
                name: "Meal Prep",
                description: "Perfect for Sunday meal prep sessions",
                color: "#3B82F6",
                isDefault: false,
                recipeCount: 8,
                recipes: [],
                createdAt: Date(),
                updatedAt: Date()
            )
        ]
    }
}

// MARK: - Collection Creation Request
struct CreateCollectionRequest: Codable {
    let name: String
    let description: String
    let color: String

    init(name: String, description: String = "", color: String = "#10B981") {
        self.name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        self.description = description.trimmingCharacters(in: .whitespacesAndNewlines)
        self.color = color
    }
}

// MARK: - Add Recipes to Collection Request
struct AddRecipesToCollectionRequest: Codable {
    let recipeIds: [String]
}