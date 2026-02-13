import mongoose from 'mongoose';

// Force delete cached model during development hot-reloads
if (process.env.NODE_ENV === 'development') {
  delete mongoose.connection.models['Collection'];
}

const CollectionSchema = new mongoose.Schema(
  {
    // User who owns this collection
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Collection name
    name: {
      type: String,
      required: [true, 'Please provide a collection name'],
      maxlength: [50, 'Collection name cannot be more than 50 characters'],
      trim: true
    },

    // Optional description
    description: {
      type: String,
      maxlength: [200, 'Description cannot be more than 200 characters'],
      trim: true,
      default: ''
    },

    // Color for visual organization
    color: {
      type: String,
      default: '#10B981', // Tailwind green-500
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
    },

    // Whether this is a default system collection
    isDefault: {
      type: Boolean,
      default: false,
      index: true
    },

    // Array of recipe IDs in this collection
    recipes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    }],

    // For ordering collections
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
  }
);

// Add compound indexes for efficient queries
CollectionSchema.index({ userId: 1, isDefault: 1 }); // Find user's default collections
CollectionSchema.index({ userId: 1, sortOrder: 1 }); // Sort user's collections
CollectionSchema.index({ userId: 1, name: 1 }, { unique: true }); // Unique collection names per user

// Virtual for recipe count
CollectionSchema.virtual('recipeCount').get(function() {
  return this.recipes ? this.recipes.length : 0;
});

// Ensure virtual fields are serialized
CollectionSchema.set('toJSON', { virtuals: true });
CollectionSchema.set('toObject', { virtuals: true });

// Pre-save middleware to handle default collection logic
CollectionSchema.pre('save', async function() {
  // Ensure Favorites collection is marked as default
  if (this.name === 'Favorites' && !this.isDefault) {
    this.isDefault = true;
  }
});

// Static method to create default collections for a user
CollectionSchema.statics.createDefaultCollections = async function(userId) {
  try {
    // Check if user already has default collections
    const existingFavorites = await this.findOne({
      userId,
      name: 'Favorites',
      isDefault: true
    });

    if (!existingFavorites) {
      // Create Favorites collection
      await this.create({
        userId,
        name: 'Favorites',
        description: 'Your favorite recipes',
        color: '#EF4444', // Red heart color
        isDefault: true,
        sortOrder: 0
      });
    }

    return true;
  } catch (error) {
    console.error('Error creating default collections:', error);
    return false;
  }
};

// Instance method to add a recipe to this collection
CollectionSchema.methods.addRecipe = function(recipeId) {
  const exists = this.recipes.some((id) => id?.equals?.(recipeId));
  if (!exists) {
    this.recipes.push(recipeId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove a recipe from this collection
CollectionSchema.methods.removeRecipe = function(recipeId) {
  this.recipes = this.recipes.filter(id => !id.equals(recipeId));
  return this.save();
};

// Check if model already exists (prevents Next.js from recompiling it multiple times)
export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
