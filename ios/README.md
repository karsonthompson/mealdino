# MealDino iOS App Development Guide

## Overview
This directory contains the foundation for building a native iOS app for MealDino that connects to your existing Next.js API. The iOS app will provide a native mobile experience while leveraging the same backend infrastructure as your web application.

---

## Quick Start

### 1. Prerequisites
- **Mac with macOS Monterey (12.0) or later**
- **Xcode 14.0 or later** (latest recommended)
- **iOS 16.0+ target** (for latest SwiftUI features)
- **Apple Developer Account** (for device testing and App Store deployment)

### 2. Create Xcode Project
1. Open Xcode
2. Create new iOS App project:
   - **Product Name**: `MealDino`
   - **Team**: Your Apple Developer Team
   - **Organization Identifier**: `com.yourname.mealdino`
   - **Bundle Identifier**: `com.yourname.mealdino`
   - **Language**: Swift
   - **Interface**: SwiftUI
   - **Use Core Data**: ✅ (for offline functionality)
   - **Include Tests**: ✅

3. Save the project in this `/ios` directory

### 3. Project Structure Setup
Once you've created the Xcode project, organize your files like this:

```
MealDino/
├── Models/          # Copy the Swift files from this folder
│   ├── Recipe.swift
│   ├── Collection.swift
│   └── MealPlan.swift
├── Views/           # SwiftUI view files
│   ├── Home/
│   ├── Recipes/
│   ├── Collections/
│   ├── Planning/
│   └── Authentication/
├── ViewModels/      # MVVM view models
├── Services/        # Copy the Swift files from this folder
│   ├── APIClient.swift
│   └── AuthenticationService.swift
├── Utils/           # Helper utilities and extensions
├── Resources/       # Assets, colors, fonts
└── Core Data/       # Core Data model files
```

---

## Development Phase Plan

### Phase 1: Basic Setup (Week 1)
- [x] ✅ Create project structure and models
- [x] ✅ Set up API client for backend communication
- [x] ✅ Implement authentication service framework
- [ ] 🔄 Create basic navigation structure (TabView)
- [ ] 🔄 Set up Core Data for offline storage
- [ ] 🔄 Implement basic error handling and loading states

### Phase 2: Core Features (Weeks 2-3)
- [ ] 📋 **Recipe Features**
  - [ ] Recipe list view with search and filtering
  - [ ] Recipe detail view with ingredients and instructions
  - [ ] Recipe creation and editing forms
  - [ ] Image handling and caching

- [ ] 📋 **Collection Features**
  - [ ] Collections list view
  - [ ] Collection detail with recipe management
  - [ ] Create/edit collection functionality
  - [ ] Add/remove recipes from collections

- [ ] 📋 **Authentication Integration**
  - [ ] Sign-in/sign-up flows
  - [ ] Session management
  - [ ] Protected route navigation

### Phase 3: Meal Planning (Week 4)
- [ ] 📋 **Planning Features**
  - [ ] Weekly calendar view
  - [ ] Monthly calendar view
  - [ ] Meal planning interface
  - [ ] Cooking session scheduling

### Phase 4: Polish & Testing (Weeks 5-6)
- [ ] 📋 **Final Polish**
  - [ ] UI/UX refinements and animations
  - [ ] Comprehensive error handling
  - [ ] Offline functionality testing
  - [ ] Performance optimization
  - [ ] App Store preparation

---

## Integration with Existing Backend

### API Configuration
Your iOS app will connect to your existing Next.js API. Update the base URL in `APIClient.swift`:

```swift
// For local development
let baseURL = "http://localhost:3000/api"

// For production
let baseURL = "https://your-domain.com/api"
```

### Authentication Flow
The app is designed to work with your NextAuth setup:

1. **Email Authentication**: Uses your Resend email provider
2. **Google OAuth**: Integrates with your Google OAuth setup
3. **Session Management**: Works with your MongoDB adapter

### Required Backend Modifications
You may need to make these adjustments to your Next.js app:

1. **CORS Configuration**: Add iOS app to allowed origins
2. **API Endpoints**: Ensure all endpoints return proper JSON responses
3. **Session Handling**: Configure session cookies for mobile requests

---

## Key Implementation Files

### Models (`/Models/`)
- **`Recipe.swift`**: Complete recipe model with Swift enums and computed properties
- **`Collection.swift`**: Collection model with color handling and utilities
- **`MealPlan.swift`**: Comprehensive meal planning models with date utilities

### Services (`/Services/`)
- **`APIClient.swift`**: Complete API client with Combine publishers for all endpoints
- **`AuthenticationService.swift`**: Authentication service ready for NextAuth integration

### Features to Implement

#### 1. Recipe Management
```swift
// Example usage in your views
@StateObject private var recipeViewModel = RecipeViewModel()

// In your view
RecipeListView()
  .environmentObject(recipeViewModel)
```

#### 2. Collection Management
```swift
// Example collection usage
@StateObject private var collectionViewModel = CollectionViewModel()

// Create new collection
collectionViewModel.createCollection(
  name: "Quick Meals",
  description: "30 minutes or less",
  color: "#10B981"
)
```

#### 3. Meal Planning
```swift
// Example meal planning
@StateObject private var planningViewModel = PlanningViewModel()

// Add meal to plan
planningViewModel.addMeal(
  date: Date(),
  mealType: .lunch,
  recipe: selectedRecipe,
  notes: "Extra vegetables"
)
```

---

## Development Tips

### 1. Start with Mock Data
- Use the sample data provided in the models for initial development
- Switch to real API calls once UI is working
- The `MockAPIClient` is already set up for this purpose

### 2. SwiftUI Best Practices
- Use `@StateObject` for ViewModels
- Use `@EnvironmentObject` to share data between views
- Implement proper loading and error states
- Use `@Published` properties for reactive UI updates

### 3. API Integration
- All API calls return `AnyPublisher` for reactive programming
- Handle loading states with `@Published var isLoading = false`
- Show user-friendly error messages from `APIError`

### 4. Testing Strategy
- Unit tests for ViewModels and API client
- UI tests for critical user flows
- Test offline functionality thoroughly

---

## Code Examples

### Basic Recipe List View
```swift
struct RecipeListView: View {
    @StateObject private var viewModel = RecipeListViewModel()

    var body: some View {
        NavigationView {
            List(viewModel.recipes) { recipe in
                RecipeRowView(recipe: recipe)
            }
            .navigationTitle("Recipes")
            .onAppear {
                viewModel.loadRecipes()
            }
        }
    }
}
```

### Recipe ViewModel Example
```swift
class RecipeListViewModel: ObservableObject {
    @Published var recipes: [Recipe] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiClient = APIClient.shared
    private var cancellables = Set<AnyCancellable>()

    func loadRecipes() {
        isLoading = true

        apiClient.getRecipes()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    self.isLoading = false
                    if case .failure(let error) = completion {
                        self.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { recipes in
                    self.recipes = recipes
                }
            )
            .store(in: &cancellables)
    }
}
```

---

## Deployment

### App Store Submission Checklist
- [ ] App icons (all required sizes)
- [ ] Launch screen
- [ ] App Store screenshots
- [ ] App Store description and metadata
- [ ] Privacy policy (required for data collection)
- [ ] Terms of service
- [ ] App review notes

### Required Assets
- **App Icon**: 1024x1024px for App Store, plus device-specific sizes
- **Launch Screen**: Adaptive launch screen using SwiftUI
- **Screenshots**: Required for various device sizes
- **App Store Preview Video**: Optional but recommended

---

## Next Steps

1. **Create the Xcode project** using the specifications above
2. **Copy the Model and Service files** from this directory into your project
3. **Start with Phase 1 implementation** - basic navigation and API integration
4. **Test API connectivity** with your local Next.js server
5. **Build out the core recipe features** before moving to advanced functionality

### Getting Help

- **iOS Development**: Apple's SwiftUI documentation and tutorials
- **API Integration**: Refer to `/shared/API.md` for complete endpoint documentation
- **Data Models**: See `/shared/MODELS.md` for detailed model specifications
- **Feature Requirements**: Check `/shared/FEATURES.md` for complete app functionality

---

## Environment Configuration

### Development
- API Base URL: `http://localhost:3000/api`
- Enable mock data for offline development
- Debug logging enabled

### Production
- API Base URL: Your production domain
- Disable debug logging
- Enable analytics and crash reporting

The foundation is now set! You have everything needed to build a production-quality iOS app that integrates seamlessly with your existing MealDino web application.