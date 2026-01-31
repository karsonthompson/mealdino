import Foundation
import Combine

class RecipeListViewModel: ObservableObject {
    @Published var recipes: [Recipe] = []
    @Published var filteredRecipes: [Recipe] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""
    @Published var selectedCategory: RecipeCategory?

    private let apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()

    init(apiClient: APIClient = APIClient.shared) {
        self.apiClient = apiClient
        setupSearchAndFilter()
    }

    func loadRecipes() {
        isLoading = true
        errorMessage = nil

        apiClient.getRecipes()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] recipes in
                    self?.recipes = recipes
                }
            )
            .store(in: &cancellables)
    }

    func refreshRecipes() {
        loadRecipes()
    }

    private func setupSearchAndFilter() {
        // Combine search text and category filter
        Publishers.CombineLatest3(
            $recipes,
            $searchText.debounce(for: .milliseconds(300), scheduler: RunLoop.main),
            $selectedCategory
        )
        .map { recipes, searchText, category in
            var filtered = recipes

            // Filter by category
            if let category = category {
                filtered = filtered.filter { $0.category == category }
            }

            // Filter by search text
            if !searchText.isEmpty {
                filtered = filtered.filter { recipe in
                    recipe.title.localizedCaseInsensitiveContains(searchText) ||
                    recipe.description.localizedCaseInsensitiveContains(searchText) ||
                    recipe.ingredients.joined().localizedCaseInsensitiveContains(searchText)
                }
            }

            return filtered
        }
        .assign(to: &$filteredRecipes)
    }

    func clearSearch() {
        searchText = ""
        selectedCategory = nil
    }
}

// MARK: - Recipe Detail ViewModel
class RecipeDetailViewModel: ObservableObject {
    @Published var recipe: Recipe?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isFavorited = false

    private let apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()

    init(apiClient: APIClient = APIClient.shared) {
        self.apiClient = apiClient
    }

    func loadRecipe(id: String) {
        isLoading = true
        errorMessage = nil

        apiClient.getRecipe(id: id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] recipe in
                    self?.recipe = recipe
                    self?.checkIfFavorited()
                }
            )
            .store(in: &cancellables)
    }

    func toggleFavorite() {
        // TODO: Implement favorite toggle functionality
        isFavorited.toggle()
    }

    private func checkIfFavorited() {
        // TODO: Check if recipe is in favorites collection
        isFavorited = false
    }
}