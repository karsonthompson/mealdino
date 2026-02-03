import mongoose from 'mongoose';

const RecipeSchema = new mongoose.Schema(
  {
    // User who created this recipe (null for global recipes)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },

    // Whether this recipe is available to all users
    isGlobal: {
      type: Boolean,
      default: false,
      index: true
    },

    title: {
      type: String,
      required: [true, 'Please provide a recipe title'],
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    },
    prepTime: {
      type: Number, // in minutes
      required: [true, 'Please provide prep time'],
    },
    recipeServings: {
      type: Number,
      required: [true, 'Please provide recipe servings'],
      min: [1, 'Recipe servings must be at least 1'],
      default: 1,
    },
    ingredients: {
      type: [String], // array of strings
      required: [true, 'Please provide ingredients'],
    },
    instructions: {
      type: [String], // array of strings
      required: [true, 'Please provide instructions'],
    },
    macros: {
      calories: {
        type: Number,
        required: true,
      },
      protein: {
        type: Number,
        required: true,
      },
      carbs: {
        type: Number,
        required: true,
      },
      fat: {
        type: Number,
        required: true,
      },
    },
    imageUrl: {
      type: String,
      default: 'https://via.placeholder.com/400x300?text=Recipe+Image',
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
  }
);

// Add compound indexes for efficient queries
RecipeSchema.index({ userId: 1, createdAt: -1 }); // User's recipes by creation date
RecipeSchema.index({ isGlobal: 1, createdAt: -1 }); // Global recipes by creation date
RecipeSchema.index({ category: 1, isGlobal: 1 }); // Filter by category and type

// Check if model already exists (prevents Next.js from recompiling it multiple times)
export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);
