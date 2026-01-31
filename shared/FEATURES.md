# MealDino Features & App Flow

## Core App Features

### 1. User Authentication
- **Email Magic Link**: Users can sign in using email (Resend provider)
- **Google OAuth**: Sign in with Google account
- **Session Management**: Persistent login with secure session handling
- **Guest Browsing**: View global recipes without authentication (limited features)

### 2. Recipe Management
- **Browse Recipes**: View all recipes (global + user's own)
- **Recipe Details**: Full recipe view with ingredients, instructions, macros
- **Create Recipes**: Add custom recipes with photos and nutritional info
- **Edit Recipes**: Modify user-created recipes
- **Delete Recipes**: Remove user-created recipes
- **Global vs Personal**: System recipes available to all users vs user-created recipes
- **Categories**: Organized by meal type (breakfast, lunch, dinner, snack)
- **Macronutrient Tracking**: Calories, protein, carbs, fat for each recipe

### 3. Recipe Collections
- **Favorites Collection**: Auto-created default collection for favorite recipes
- **Custom Collections**: Create named collections with custom colors
- **Collection Management**: Add/remove recipes from collections
- **Visual Organization**: Color-coded collections for easy identification
- **Recipe Counting**: Display number of recipes in each collection

### 4. Meal Planning
- **Weekly View**: Plan meals for the current week
- **Monthly View**: Extended meal planning with calendar interface
- **Daily Meals**: Plan breakfast, lunch, dinner, and snacks for each day
- **Cooking Sessions**: Plan meal prep and batch cooking sessions
- **Meal Sources**: Track whether meals are fresh, leftovers, meal prep, or frozen
- **Cooking Time Slots**: Schedule cooking for morning, afternoon, or evening
- **Cooking Purposes**: Categorize cooking (meal prep, batch cooking, etc.)
- **Nutritional Overview**: View total calories and macros for planned days

### 5. Recipe Search & Discovery
- **Category Filtering**: Filter recipes by meal type
- **Search Functionality**: Search recipes by title or ingredients
- **Global Recipe Library**: Access to curated healthy recipes
- **User Recipe Library**: Access to personally created recipes

---

## App Navigation Structure

### Tab-Based Navigation
1. **Home Tab**: Featured recipes, quick actions, recent activity
2. **Recipes Tab**: Browse and search all recipes
3. **Collections Tab**: Manage recipe collections and favorites
4. **Plan Tab**: Weekly/monthly meal planning calendar
5. **Profile Tab**: User settings, account management

### Detailed Screen Flow

#### Home Screen
- Welcome message with user name
- Quick add recipe button
- Featured/recommended recipes
- Recent recipe activity
- Quick access to meal planning

#### Recipe Screens
1. **Recipe List**: Grid/list view of all recipes with search/filter
2. **Recipe Detail**: Full recipe with ingredients, instructions, macros
3. **Recipe Creation**: Form for adding new recipes
4. **Recipe Edit**: Modify existing user recipes

#### Collection Screens
1. **Collection List**: All user collections with recipe counts
2. **Collection Detail**: Recipes within a specific collection
3. **Add to Collections**: Multi-select interface for adding recipes
4. **Create Collection**: Form for new collection with color picker

#### Meal Planning Screens
1. **Weekly Calendar**: 7-day meal planning grid
2. **Monthly Calendar**: Full month calendar view
3. **Daily Detail**: Detailed view of a single day's meals
4. **Add Meal Modal**: Recipe selection for meal planning
5. **Cooking Sessions**: Meal prep and batch cooking planning

#### Profile Screens
1. **User Profile**: Account info and settings
2. **Settings**: App preferences and configuration
3. **Authentication**: Sign in/out flows

---

## Key User Workflows

### Recipe Discovery & Saving Workflow
1. User browses recipe list or searches
2. User taps recipe to view details
3. User adds recipe to favorites or custom collection
4. User can plan recipe for specific meals

### Meal Planning Workflow
1. User navigates to Plan tab
2. User selects date on calendar
3. User taps meal slot (breakfast, lunch, dinner, snack)
4. User searches/browses recipes to add
5. User confirms meal planning
6. Optional: Plan cooking sessions for meal prep

### Recipe Creation Workflow
1. User taps "Add Recipe" button
2. User fills out recipe form:
   - Title and description
   - Category selection
   - Prep time
   - Ingredients list
   - Instructions steps
   - Nutritional information
   - Optional photo
3. User saves recipe
4. Recipe appears in user's personal collection

### Collection Management Workflow
1. User creates custom collection with name and color
2. User browses recipes and adds to collections
3. User can view collections to see grouped recipes
4. User can remove recipes from collections

---

## App States & Data Management

### Authentication States
- **Unauthenticated**: Limited access to global recipes only
- **Authenticated**: Full access to personal recipes, collections, meal planning

### Data Synchronization
- **Online Mode**: Real-time sync with backend API
- **Offline Mode**: Local storage with sync when reconnected
- **Conflict Resolution**: Server data takes precedence

### Error Handling
- **Network Errors**: Graceful degradation to offline mode
- **Validation Errors**: Clear user feedback for form submissions
- **Authentication Errors**: Redirect to sign-in with clear messaging

---

## Unique Features & Value Propositions

### Health-Focused Design
- **Macro Tracking**: Built-in nutritional information for all recipes
- **Healthy Categories**: Focus on clean, healthy meal options
- **Meal Planning**: Comprehensive planning to support healthy eating habits

### User Experience
- **Visual Organization**: Color-coded collections and intuitive navigation
- **Meal Prep Support**: Dedicated cooking session planning
- **Flexible Planning**: Both weekly and monthly planning views
- **Quick Actions**: Streamlined recipe creation and meal planning

### Personalization
- **Custom Collections**: Users can organize recipes their way
- **Personal Recipes**: Full recipe creation and management
- **Individual Meal Plans**: Personalized weekly/monthly planning

---

## Technical Requirements for iOS

### Offline Functionality
- Core Data integration for offline recipe storage
- Sync queue for offline actions when reconnected
- Cache management for images and data

### Performance Considerations
- Lazy loading for recipe images
- Pagination for large recipe lists
- Efficient calendar rendering for meal planning

### iOS-Specific Features
- Native navigation with SwiftUI
- Share sheet integration for recipes
- Spotlight search integration
- Widget support for meal planning
- Apple Health integration for nutritional tracking (future)

### Accessibility
- VoiceOver support for all UI elements
- Dynamic Type support for text scaling
- High contrast mode support
- Haptic feedback for user actions

---

## Future Enhancement Ideas

### Social Features
- Share recipes with other users
- Recipe rating and reviews
- Community recipe contributions

### Advanced Planning
- Shopping list generation from meal plans
- Grocery delivery integration
- Meal prep scheduling reminders

### Health Integration
- Apple Health nutrition tracking
- Fitness app integration for calorie goals
- Custom dietary restriction filtering

### Smart Features
- AI-powered recipe recommendations
- Smart meal planning based on preferences
- Ingredient substitution suggestions