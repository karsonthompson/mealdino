import Foundation
import Combine

// MARK: - API Client
class APIClient: ObservableObject {
    static let shared = APIClient()

    private let baseURL: String
    private let session: URLSession
    private var cancellables = Set<AnyCancellable>()

    init(baseURL: String = "http://localhost:3000/api") {
        self.baseURL = baseURL
        self.session = URLSession(configuration: .default)
    }

    // MARK: - Generic API Request Method
    private func request<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: Data? = nil,
        responseType: T.Type
    ) -> AnyPublisher<T, APIError> {
        guard let url = URL(string: baseURL + endpoint) else {
            return Fail(error: APIError(success: false, message: "Invalid URL", error: nil))
                .eraseToAnyPublisher()
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body = body {
            request.httpBody = body
        }

        return session.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: APIResponse<T>.self, decoder: JSONDecoder.apiDecoder)
            .tryMap { response in
                if response.success, let data = response.data {
                    return data
                } else {
                    throw APIError(
                        success: false,
                        message: response.message ?? "Unknown error",
                        error: response.error
                    )
                }
            }
            .mapError { error in
                if let apiError = error as? APIError {
                    return apiError
                } else {
                    return APIError(
                        success: false,
                        message: error.localizedDescription,
                        error: nil
                    )
                }
            }
            .eraseToAnyPublisher()
    }

    // MARK: - Recipe API Methods
    func getRecipes() -> AnyPublisher<[Recipe], APIError> {
        return request(endpoint: "/recipes", responseType: [Recipe].self)
    }

    func getRecipe(id: String) -> AnyPublisher<Recipe, APIError> {
        return request(endpoint: "/recipes/\(id)", responseType: Recipe.self)
    }

    func createRecipe(_ recipe: CreateRecipeRequest) -> AnyPublisher<Recipe, APIError> {
        guard let body = try? JSONEncoder().encode(recipe) else {
            return Fail(error: APIError(success: false, message: "Failed to encode recipe", error: nil))
                .eraseToAnyPublisher()
        }

        return request(
            endpoint: "/recipes",
            method: .POST,
            body: body,
            responseType: Recipe.self
        )
    }

    func updateRecipe(id: String, recipe: UpdateRecipeRequest) -> AnyPublisher<Recipe, APIError> {
        guard let body = try? JSONEncoder().encode(recipe) else {
            return Fail(error: APIError(success: false, message: "Failed to encode recipe", error: nil))
                .eraseToAnyPublisher()
        }

        return request(
            endpoint: "/recipes/\(id)",
            method: .PUT,
            body: body,
            responseType: Recipe.self
        )
    }

    func deleteRecipe(id: String) -> AnyPublisher<Bool, APIError> {
        return request(
            endpoint: "/recipes/\(id)",
            method: .DELETE,
            responseType: EmptyResponse.self
        )
        .map { _ in true }
        .eraseToAnyPublisher()
    }

    // MARK: - Collection API Methods
    func getCollections() -> AnyPublisher<[Collection], APIError> {
        return request(endpoint: "/collections", responseType: [Collection].self)
    }

    func getCollection(id: String) -> AnyPublisher<Collection, APIError> {
        return request(endpoint: "/collections/\(id)", responseType: Collection.self)
    }

    func createCollection(_ collection: CreateCollectionRequest) -> AnyPublisher<Collection, APIError> {
        guard let body = try? JSONEncoder().encode(collection) else {
            return Fail(error: APIError(success: false, message: "Failed to encode collection", error: nil))
                .eraseToAnyPublisher()
        }

        return request(
            endpoint: "/collections",
            method: .POST,
            body: body,
            responseType: Collection.self
        )
    }

    func addRecipesToCollection(id: String, recipeIds: [String]) -> AnyPublisher<Collection, APIError> {
        let request = AddRecipesToCollectionRequest(recipeIds: recipeIds)
        guard let body = try? JSONEncoder().encode(request) else {
            return Fail(error: APIError(success: false, message: "Failed to encode request", error: nil))
                .eraseToAnyPublisher()
        }

        return self.request(
            endpoint: "/collections/\(id)/recipes",
            method: .POST,
            body: body,
            responseType: Collection.self
        )
    }

    func deleteCollection(id: String) -> AnyPublisher<Bool, APIError> {
        return request(
            endpoint: "/collections/\(id)",
            method: .DELETE,
            responseType: EmptyResponse.self
        )
        .map { _ in true }
        .eraseToAnyPublisher()
    }

    // MARK: - Meal Plan API Methods
    func getMealPlans(startDate: String, endDate: String) -> AnyPublisher<[MealPlan], APIError> {
        let endpoint = "/meal-plans?start=\(startDate)&end=\(endDate)"
        return request(endpoint: endpoint, responseType: [MealPlan].self)
    }

    func addMealToPlan(_ mealRequest: AddMealRequest) -> AnyPublisher<MealPlan, APIError> {
        guard let body = try? JSONEncoder().encode(mealRequest) else {
            return Fail(error: APIError(success: false, message: "Failed to encode meal", error: nil))
                .eraseToAnyPublisher()
        }

        return request(
            endpoint: "/meal-plans/add",
            method: .POST,
            body: body,
            responseType: MealPlan.self
        )
    }

    func deleteMealPlan(date: String) -> AnyPublisher<Bool, APIError> {
        return request(
            endpoint: "/meal-plans/\(date)",
            method: .DELETE,
            responseType: EmptyResponse.self
        )
        .map { _ in true }
        .eraseToAnyPublisher()
    }
}

// MARK: - HTTP Methods
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
}

// MARK: - API Response Models
struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let message: String?
    let count: Int?
    let error: String?
}

struct APIError: Codable, Error, LocalizedError {
    let success: Bool
    let message: String
    let error: String?

    var errorDescription: String? {
        return message
    }
}

struct EmptyResponse: Codable {
    // Used for DELETE requests that don't return data
}

// MARK: - Request Models
struct CreateRecipeRequest: Codable {
    let title: String
    let description: String
    let category: String
    let prepTime: Int
    let ingredients: [String]
    let instructions: [String]
    let macros: MacroNutrients
    let imageUrl: String?

    init(recipe: Recipe) {
        self.title = recipe.title
        self.description = recipe.description
        self.category = recipe.category.rawValue
        self.prepTime = recipe.prepTime
        self.ingredients = recipe.ingredients
        self.instructions = recipe.instructions
        self.macros = recipe.macros
        self.imageUrl = recipe.imageUrl
    }
}

struct UpdateRecipeRequest: Codable {
    let title: String?
    let description: String?
    let category: String?
    let prepTime: Int?
    let ingredients: [String]?
    let instructions: [String]?
    let macros: MacroNutrients?
    let imageUrl: String?
}

// MARK: - JSON Decoder Extension
extension JSONDecoder {
    static var apiDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

// MARK: - Mock API Client for Development
class MockAPIClient: APIClient {
    override init() {
        super.init(baseURL: "mock://api")
    }

    override func getRecipes() -> AnyPublisher<[Recipe], APIError> {
        return Just(Recipe.sampleRecipes)
            .delay(for: .seconds(0.5), scheduler: RunLoop.main) // Simulate network delay
            .setFailureType(to: APIError.self)
            .eraseToAnyPublisher()
    }

    override func getCollections() -> AnyPublisher<[Collection], APIError> {
        return Just(Collection.sampleCollections)
            .delay(for: .seconds(0.5), scheduler: RunLoop.main)
            .setFailureType(to: APIError.self)
            .eraseToAnyPublisher()
    }

    override func getMealPlans(startDate: String, endDate: String) -> AnyPublisher<[MealPlan], APIError> {
        return Just([MealPlan.sampleMealPlan])
            .delay(for: .seconds(0.5), scheduler: RunLoop.main)
            .setFailureType(to: APIError.self)
            .eraseToAnyPublisher()
    }
}