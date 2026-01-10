import dbConnect from './mongodb';
import Recipe from '@/models/Recipe';
import mongoose from 'mongoose';

// Get all recipes (global + user's own recipes if userId provided)
export async function getAllRecipes(userId) {
  try {
    await dbConnect();

    // Build query: global recipes + user's own recipes if userId provided
    const query = (userId && userId !== null) ?
      { $or: [{ isGlobal: true }, { userId: userId }] } :
      { isGlobal: true };

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });

    // Convert MongoDB documents to plain objects
    return recipes.map(recipe => ({
      _id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prepTime: recipe.prepTime,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      macros: recipe.macros,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId ? recipe.userId.toString() : null,
      isGlobal: recipe.isGlobal,
      createdAt: recipe.createdAt ? recipe.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: recipe.updatedAt ? recipe.updatedAt.toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

// Get single recipe by ID
export async function getRecipeById(id) {
  try {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    await dbConnect();
    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return null;
    }

    // Convert MongoDB document to plain object
    return {
      _id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prepTime: recipe.prepTime,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      macros: recipe.macros,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId ? recipe.userId.toString() : null,
      isGlobal: recipe.isGlobal,
      createdAt: recipe.createdAt ? recipe.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: recipe.updatedAt ? recipe.updatedAt.toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

// Get only user's recipes
export async function getUserRecipes(userId) {
  try {
    await dbConnect();
    const recipes = await Recipe.find({ userId }).sort({ createdAt: -1 });

    return recipes.map(recipe => ({
      _id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prepTime: recipe.prepTime,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      macros: recipe.macros,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId.toString(),
      isGlobal: recipe.isGlobal,
      createdAt: recipe.createdAt ? recipe.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: recipe.updatedAt ? recipe.updatedAt.toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    return [];
  }
}

// Create a new user recipe
export async function createUserRecipe(userId, recipeData) {
  try {
    await dbConnect();

    const newRecipe = new Recipe({
      ...recipeData,
      userId,
      isGlobal: false
    });

    await newRecipe.save();

    return {
      _id: newRecipe._id.toString(),
      title: newRecipe.title,
      description: newRecipe.description,
      category: newRecipe.category,
      prepTime: newRecipe.prepTime,
      ingredients: newRecipe.ingredients,
      instructions: newRecipe.instructions,
      macros: newRecipe.macros,
      imageUrl: newRecipe.imageUrl,
      userId: newRecipe.userId.toString(),
      isGlobal: newRecipe.isGlobal,
      createdAt: newRecipe.createdAt.toISOString(),
      updatedAt: newRecipe.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error creating user recipe:', error);
    throw error;
  }
}

// Update user recipe (only if user owns it)
export async function updateUserRecipe(recipeId, userId, recipeData) {
  try {
    await dbConnect();

    const recipe = await Recipe.findOne({ _id: recipeId, userId });
    if (!recipe) {
      throw new Error('Recipe not found or not owned by user');
    }

    Object.assign(recipe, recipeData);
    await recipe.save();

    return {
      _id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prepTime: recipe.prepTime,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      macros: recipe.macros,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId.toString(),
      isGlobal: recipe.isGlobal,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error updating user recipe:', error);
    throw error;
  }
}

// Delete user recipe (only if user owns it)
export async function deleteUserRecipe(recipeId, userId) {
  try {
    await dbConnect();

    const result = await Recipe.findOneAndDelete({ _id: recipeId, userId });
    if (!result) {
      throw new Error('Recipe not found or not owned by user');
    }

    return true;
  } catch (error) {
    console.error('Error deleting user recipe:', error);
    throw error;
  }
}

// Get only global recipes
export async function getGlobalRecipes() {
  try {
    await dbConnect();
    const recipes = await Recipe.find({ isGlobal: true }).sort({ createdAt: -1 });

    return recipes.map(recipe => ({
      _id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prepTime: recipe.prepTime,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      macros: recipe.macros,
      imageUrl: recipe.imageUrl,
      userId: recipe.userId ? recipe.userId.toString() : null,
      isGlobal: recipe.isGlobal,
      createdAt: recipe.createdAt ? recipe.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: recipe.updatedAt ? recipe.updatedAt.toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching global recipes:', error);
    return [];
  }
}