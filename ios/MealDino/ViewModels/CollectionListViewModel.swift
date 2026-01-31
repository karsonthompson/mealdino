import Foundation
import Combine

class CollectionListViewModel: ObservableObject {
    @Published var collections: [Collection] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showingCreateCollection = false

    private let apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()

    init(apiClient: APIClient = APIClient.shared) {
        self.apiClient = apiClient
    }

    func loadCollections() {
        isLoading = true
        errorMessage = nil

        apiClient.getCollections()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] collections in
                    self?.collections = collections
                }
            )
            .store(in: &cancellables)
    }

    func createCollection(_ request: CreateCollectionRequest) {
        apiClient.createCollection(request)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] newCollection in
                    self?.collections.append(newCollection)
                    self?.showingCreateCollection = false
                }
            )
            .store(in: &cancellables)
    }

    func deleteCollection(_ collection: Collection) {
        guard !collection.isDefault else { return }

        apiClient.deleteCollection(id: collection.id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] _ in
                    self?.collections.removeAll { $0.id == collection.id }
                }
            )
            .store(in: &cancellables)
    }

    var favoritesCollection: Collection? {
        return collections.first { $0.isDefault && $0.name == "Favorites" }
    }

    var customCollections: [Collection] {
        return collections.filter { !$0.isDefault }
    }
}

// MARK: - Collection Detail ViewModel
class CollectionDetailViewModel: ObservableObject {
    @Published var collection: Collection?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showingAddRecipes = false

    private let apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()

    init(apiClient: APIClient = APIClient.shared) {
        self.apiClient = apiClient
    }

    func loadCollection(id: String) {
        isLoading = true
        errorMessage = nil

        apiClient.getCollection(id: id)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] collection in
                    self?.collection = collection
                }
            )
            .store(in: &cancellables)
    }

    func addRecipes(_ recipeIds: [String]) {
        guard let collection = collection else { return }

        apiClient.addRecipesToCollection(id: collection.id, recipeIds: recipeIds)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] updatedCollection in
                    self?.collection = updatedCollection
                    self?.showingAddRecipes = false
                }
            )
            .store(in: &cancellables)
    }
}