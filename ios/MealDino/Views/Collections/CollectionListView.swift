import SwiftUI

struct CollectionListView: View {
    @StateObject private var viewModel = CollectionListViewModel()

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if viewModel.isLoading {
                    LoadingView()
                } else if let errorMessage = viewModel.errorMessage {
                    ErrorView(message: errorMessage) {
                        viewModel.loadCollections()
                    }
                } else {
                    collectionsList
                }
            }
            .navigationTitle("Collections")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        viewModel.showingCreateCollection = true
                    }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $viewModel.showingCreateCollection) {
                CreateCollectionView(viewModel: viewModel)
            }
            .refreshable {
                viewModel.loadCollections()
            }
        }
        .onAppear {
            if viewModel.collections.isEmpty {
                viewModel.loadCollections()
            }
        }
    }

    private var collectionsList: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Favorites Collection (if exists)
                if let favoritesCollection = viewModel.favoritesCollection {
                    CollectionCard(collection: favoritesCollection, isProminent: true)
                }

                // Custom Collections
                ForEach(viewModel.customCollections) { collection in
                    CollectionCard(collection: collection)
                        .contextMenu {
                            Button(role: .destructive) {
                                viewModel.deleteCollection(collection)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                }

                // Empty State
                if viewModel.collections.isEmpty {
                    EmptyCollectionsView {
                        viewModel.showingCreateCollection = true
                    }
                }
            }
            .padding()
        }
    }
}

struct CollectionCard: View {
    let collection: Collection
    var isProminent: Bool = false

    var body: some View {
        NavigationLink(destination: CollectionDetailView(collectionId: collection.id)) {
            HStack(spacing: 16) {
                // Collection Icon
                RoundedRectangle(cornerRadius: 12)
                    .fill(collection.colorValue.gradient)
                    .frame(width: 60, height: 60)
                    .overlay {
                        Image(systemName: collection.iconName)
                            .font(.title2)
                            .foregroundColor(.white)
                    }

                // Collection Info
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(collection.name)
                            .font(isProminent ? .title2 : .headline)
                            .fontWeight(.semibold)
                            .lineLimit(1)

                        if collection.isDefault {
                            Image(systemName: "star.fill")
                                .font(.caption)
                                .foregroundColor(.yellow)
                        }

                        Spacer()
                    }

                    if !collection.description.isEmpty {
                        Text(collection.description)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }

                    HStack {
                        Text(collection.displayRecipeCount)
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Spacer()

                        if collection.recipeCount > 0 {
                            // Recipe preview thumbnails
                            HStack(spacing: -8) {
                                ForEach(Array(collection.recipes.prefix(3).enumerated()), id: \.offset) { index, recipe in
                                    AsyncImage(url: URL(string: recipe.imageUrl)) { image in
                                        image
                                            .resizable()
                                            .aspectRatio(contentMode: .fill)
                                    } placeholder: {
                                        Rectangle()
                                            .fill(Color(.systemGray5))
                                    }
                                    .frame(width: 24, height: 24)
                                    .clipShape(Circle())
                                    .overlay(
                                        Circle()
                                            .stroke(Color(.systemBackground), lineWidth: 2)
                                    )
                                    .zIndex(Double(3 - index))
                                }
                            }
                        }
                    }
                }

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}

struct CreateCollectionView: View {
    @ObservedObject var viewModel: CollectionListViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var description = ""
    @State private var selectedColor = "#10B981"

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Collection Details")) {
                    TextField("Collection Name", text: $name)

                    TextField("Description (Optional)", text: $description, axis: .vertical)
                        .lineLimit(3)
                }

                Section(header: Text("Color")) {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 16) {
                        ForEach(Collection.predefinedColors, id: \.self) { color in
                            Button(action: {
                                selectedColor = color
                            }) {
                                Circle()
                                    .fill(Color(hex: color) ?? .gray)
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Circle()
                                            .stroke(Color.primary, lineWidth: selectedColor == color ? 3 : 0)
                                    )
                                    .scaleEffect(selectedColor == color ? 1.2 : 1.0)
                                    .animation(.spring(response: 0.3), value: selectedColor)
                            }
                        }
                    }
                    .padding(.vertical)
                }

                Section {
                    Button("Create Collection") {
                        let request = CreateCollectionRequest(
                            name: name,
                            description: description,
                            color: selectedColor
                        )
                        viewModel.createCollection(request)
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .navigationTitle("New Collection")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .onChange(of: viewModel.showingCreateCollection) { isShowing in
            if !isShowing {
                dismiss()
            }
        }
    }
}

struct EmptyCollectionsView: View {
    let onCreateCollection: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "folder.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            VStack(spacing: 8) {
                Text("No Collections Yet")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("Create collections to organize your favorite recipes")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Button("Create Your First Collection") {
                onCreateCollection()
            }
            .buttonStyle(.borderedProminent)
            .buttonBorderShape(.roundedRectangle)
        }
        .padding()
    }
}

#Preview {
    CollectionListView()
}