import mongoose from 'mongoose';

const RecipeSchema = new mongoose.Schema(
  {
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

// Check if model already exists (prevents Next.js from recompiling it multiple times)
export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);
