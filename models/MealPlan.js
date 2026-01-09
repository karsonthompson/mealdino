import mongoose from 'mongoose';

const MealPlanSchema = new mongoose.Schema(
  {
    // The date for this meal plan (e.g., "2025-01-08")
    date: {
      type: String,
      required: [true, 'Please provide a date'],
      unique: true, // Only one meal plan per date
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
    },

    // Array of meals planned for this day
    meals: [{
      type: {
        type: String,
        required: true,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      },
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe', // References your existing Recipe model
        required: true
      },
      notes: {
        type: String,
        maxlength: [200, 'Notes cannot be more than 200 characters'],
        default: ''
      },
      // Optional: track if this is leftovers, meal prep, etc.
      source: {
        type: String,
        enum: ['fresh', 'leftovers', 'meal_prep', 'frozen'],
        default: 'fresh'
      }
    }],

    // Array of cooking sessions planned for this day
    cookingSessions: [{
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
      },
      notes: {
        type: String,
        maxlength: [200, 'Notes cannot be more than 200 characters'],
        default: ''
      },
      // Time of day for cooking (optional)
      timeSlot: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        default: 'afternoon'
      },
      // How many servings to prep
      servings: {
        type: Number,
        min: 1,
        max: 20,
        default: 1
      },
      // What this prep is for
      purpose: {
        type: String,
        enum: ['meal_prep', 'batch_cooking', 'weekly_prep', 'daily_cooking'],
        default: 'daily_cooking'
      }
    }]
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Add some helpful methods to the schema
MealPlanSchema.methods.getTotalMeals = function() {
  return this.meals.length;
};

MealPlanSchema.methods.getTotalCookingSessions = function() {
  return this.cookingSessions.length;
};

MealPlanSchema.methods.hasMealType = function(mealType) {
  return this.meals.some(meal => meal.type === mealType);
};

// Index for faster queries by date
MealPlanSchema.index({ date: 1 });

// Check if model already exists (prevents Next.js from recompiling it multiple times)
export default mongoose.models.MealPlan || mongoose.model('MealPlan', MealPlanSchema);