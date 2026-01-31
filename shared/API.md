# MealDino API Documentation

## Base URLs
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

### NextAuth Configuration
- **Provider 1**: Email (Resend) - Magic link authentication
- **Provider 2**: Google OAuth
- **Session Strategy**: Database-based sessions with MongoDB
- **Adapter**: MongoDB adapter for session/user storage

### Authentication Endpoints
- **Sign In**: `/api/auth/signin`
- **Sign Out**: `/api/auth/signout`
- **Session**: `/api/auth/session`
- **Callback**: `/api/auth/callback/[provider]`

### Authentication Headers
All authenticated endpoints require a valid session cookie or bearer token.

---

## Recipe Endpoints

### GET `/api/recipes`
Get all recipes (global + user's own if authenticated)

**Response:**
```json
{
  "success": true,
  "data": [Recipe],
  "count": 25
}
```

### GET `/api/recipes/user`
Get only the authenticated user's recipes

**Auth Required**: Yes

### GET `/api/recipes/global`
Get only global recipes (available to all users)

### GET `/api/recipes/user-only`
Get only user's private recipes (not global)

**Auth Required**: Yes

### GET `/api/recipes/[id]`
Get single recipe by ID

**Parameters:**
- `id` - MongoDB ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Healthy Chicken Bowl",
    "description": "A nutritious and delicious chicken bowl",
    "category": "lunch",
    "prepTime": 25,
    "ingredients": ["chicken breast", "rice", "vegetables"],
    "instructions": ["Cook chicken", "Prepare rice", "Combine"],
    "macros": {
      "calories": 450,
      "protein": 35,
      "carbs": 45,
      "fat": 12
    },
    "imageUrl": "https://example.com/image.jpg",
    "userId": "507f1f77bcf86cd799439012",
    "isGlobal": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### POST `/api/recipes`
Create a new recipe

**Auth Required**: Yes

**Request Body:**
```json
{
  "title": "Recipe Title",
  "description": "Recipe description",
  "category": "breakfast|lunch|dinner|snack",
  "prepTime": 30,
  "ingredients": ["ingredient1", "ingredient2"],
  "instructions": ["step1", "step2"],
  "macros": {
    "calories": 400,
    "protein": 25,
    "carbs": 40,
    "fat": 15
  },
  "imageUrl": "https://example.com/image.jpg"
}
```

### PUT `/api/recipes/[id]`
Update a recipe (only if user owns it)

**Auth Required**: Yes
**Same request body as POST**

### DELETE `/api/recipes/[id]`
Delete a recipe (only if user owns it)

**Auth Required**: Yes

---

## Collection Endpoints

### GET `/api/collections`
Get all collections for authenticated user

**Auth Required**: Yes

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Favorites",
      "description": "Your favorite recipes",
      "color": "#EF4444",
      "isDefault": true,
      "recipeCount": 5,
      "recipes": [Recipe],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST `/api/collections`
Create a new collection

**Auth Required**: Yes

**Request Body:**
```json
{
  "name": "Collection Name",
  "description": "Optional description",
  "color": "#10B981"
}
```

### GET `/api/collections/[id]`
Get single collection with all recipes

**Auth Required**: Yes

### PUT `/api/collections/[id]`
Update collection details

**Auth Required**: Yes

### DELETE `/api/collections/[id]`
Delete collection (cannot delete default collections)

**Auth Required**: Yes

### POST `/api/collections/[id]/recipes`
Add recipes to collection

**Auth Required**: Yes

**Request Body:**
```json
{
  "recipeIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

### DELETE `/api/collections/[id]/recipes`
Remove recipes from collection

**Auth Required**: Yes

---

## Meal Plan Endpoints

### GET `/api/meal-plans`
Get meal plans for a date range

**Auth Required**: Yes

**Query Parameters:**
- `start` - Start date (YYYY-MM-DD) - defaults to current week start
- `end` - End date (YYYY-MM-DD) - defaults to current week end

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "date": "2024-01-15",
      "meals": [
        {
          "type": "breakfast",
          "recipe": {
            "_id": "507f1f77bcf86cd799439011",
            "title": "Oatmeal Bowl",
            "category": "breakfast",
            "prepTime": 10,
            "macros": { "calories": 300, "protein": 12, "carbs": 45, "fat": 8 }
          },
          "notes": "Extra berries",
          "source": "fresh"
        }
      ],
      "cookingSessions": [
        {
          "recipe": {
            "_id": "507f1f77bcf86cd799439011",
            "title": "Meal Prep Chicken",
            "category": "lunch",
            "prepTime": 60
          },
          "notes": "Prep for 3 days",
          "timeSlot": "afternoon",
          "servings": 6,
          "purpose": "meal_prep"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "dateRange": {
    "start": "2024-01-15",
    "end": "2024-01-21"
  },
  "count": 7
}
```

### POST `/api/meal-plans/add`
Add a meal to a specific date

**Auth Required**: Yes

**Request Body:**
```json
{
  "date": "2024-01-15",
  "meal": {
    "type": "lunch",
    "recipe": "507f1f77bcf86cd799439011",
    "notes": "Optional notes",
    "source": "fresh"
  }
}
```

### PUT `/api/meal-plans/[date]`
Update entire meal plan for a date

**Auth Required**: Yes

### DELETE `/api/meal-plans/[date]`
Delete meal plan for a date

**Auth Required**: Yes

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Authentication required
- `403` - Forbidden (not authorized)
- `404` - Resource not found
- `409` - Conflict (duplicate resource)
- `500` - Internal server error

---

## Data Validation

### Recipe Categories
- `breakfast`
- `lunch`
- `dinner`
- `snack`

### Meal Types (for meal plans)
- `breakfast`
- `lunch`
- `dinner`
- `snack`

### Cooking Session Time Slots
- `morning`
- `afternoon`
- `evening`

### Cooking Session Purposes
- `meal_prep`
- `batch_cooking`
- `weekly_prep`
- `daily_cooking`

### Meal Sources
- `fresh`
- `leftovers`
- `meal_prep`
- `frozen`