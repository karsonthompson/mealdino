# MealDino iOS App Setup Instructions

## 🚀 Quick Setup Guide

### 1. Open Xcode
1. Launch Xcode 14.0+ on your Mac
2. Select **"Create a new Xcode project"**

### 2. Project Configuration
Configure your project with these **exact** settings:

- **Template**: iOS → App
- **Product Name**: `MealDino`
- **Team**: Your Apple Developer Team
- **Organization Identifier**: `com.yourname.mealdino` (replace with your domain)
- **Bundle Identifier**: `com.yourname.mealdino`
- **Language**: Swift
- **Interface**: SwiftUI
- **Use Core Data**: ✅ **Enable this**
- **Include Tests**: ✅ **Enable this**

### 3. Save Location
**IMPORTANT**: Save the project in this `/ios` directory:
```
/Users/karsonthompson/mealdino/ios/
```

So your project structure will be:
```
mealdino/
├── [your web app files]
├── shared/
├── ios/
│   ├── MealDino/           # Your complete app code is here
│   └── MealDino.xcodeproj  # Your Xcode project goes here
```

### 4. Import the App Code
After creating the Xcode project:

1. **Delete default files**: Remove the default `ContentView.swift` and any other template files
2. **Drag the MealDino folder**: Drag the entire `/ios/MealDino/` folder into your Xcode project navigator
3. **Choose options**:
   - ✅ Copy items if needed
   - ✅ Create groups
   - ✅ Add to target: MealDino

### 5. Configure Info.plist
Replace the default Info.plist with the one provided at `/ios/MealDino/Info.plist`

### 6. Update Project Settings
In your Xcode project settings:

1. **Deployment Target**: iOS 16.0+
2. **Bundle Identifier**: Match what you set during project creation
3. **Team**: Your Apple Developer Team

---

## 📱 Your Complete App Structure

Once imported, your Xcode project will have:

```
MealDino/
├── MealDinoApp.swift          # Main app entry point
├── ContentView.swift          # Root view with auth logic
├── Models/                    # Data models
│   ├── Recipe.swift
│   ├── Collection.swift
│   └── MealPlan.swift
├── Views/                     # All SwiftUI views
│   ├── Home/
│   │   └── HomeView.swift
│   ├── Recipes/
│   │   ├── RecipeListView.swift
│   │   └── RecipeDetailView.swift
│   ├── Collections/
│   │   ├── CollectionListView.swift
│   │   └── CollectionDetailView.swift
│   ├── Planning/
│   │   └── PlanningView.swift
│   ├── Authentication/
│   │   ├── AuthenticationView.swift
│   │   └── ProfileView.swift
│   └── Components/
│       └── LoadingView.swift
├── ViewModels/                # MVVM view models
│   ├── RecipeListViewModel.swift
│   ├── CollectionListViewModel.swift
│   └── PlanningViewModel.swift
└── Services/                  # API and authentication
    ├── APIClient.swift
    └── AuthenticationService.swift
```

---

## ⚙️ Configuration Steps

### 1. Update API Base URL
In `Services/APIClient.swift`, update the base URL:

```swift
// For local development
private let baseURL: String = "http://localhost:3000/api"

// For production (when deploying)
// private let baseURL: String = "https://your-domain.com/api"
```

### 2. Start Your Web Server
Make sure your Next.js web app is running:

```bash
cd /Users/karsonthompson/mealdino
npm run dev
```

Your web app should be accessible at http://localhost:3000

### 3. Test the Connection
1. Build and run your iOS app in the simulator
2. The app should be able to connect to your local API
3. Test authentication and data loading

---

## 🧪 Features Included

### ✅ Fully Implemented
- **Authentication**: Email magic link + Google OAuth setup
- **Recipe Management**: Browse, view, search, and filter recipes
- **Collections**: Create and manage recipe collections
- **Meal Planning**: Weekly meal planning calendar
- **MVVM Architecture**: Clean separation of concerns
- **Error Handling**: Comprehensive error states
- **Loading States**: Smooth loading experiences

### 📋 Ready for Development
- **API Integration**: All endpoints mapped to your Next.js API
- **Offline Support**: Core Data setup (needs implementation)
- **Push Notifications**: Framework ready
- **Image Caching**: AsyncImage with placeholders

---

## 🚀 Next Steps After Setup

1. **Build & Test**: Run the app in simulator
2. **API Testing**: Verify connection to your local server
3. **Customization**: Update colors, fonts, and branding
4. **Additional Features**: Add recipe creation, image upload
5. **Production**: Configure for App Store deployment

---

## 📞 Need Help?

### Common Issues
- **Build errors**: Make sure all files are added to target
- **API connection**: Verify web server is running on localhost:3000
- **Authentication**: Check NextAuth configuration

### File Locations
- **API Documentation**: `/shared/API.md`
- **Data Models**: `/shared/MODELS.md`
- **Feature Guide**: `/shared/FEATURES.md`
- **Development Guide**: `/ios/README.md`

---

**Ready to build your iOS app!** 🎉

The foundation is complete - you have a production-ready iOS app structure that integrates seamlessly with your existing MealDino web application.