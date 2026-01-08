import dbConnect from './mongodb';
import Recipe from '@/models/Recipe';
import mongoose from 'mongoose';

// Get all recipes
export async function getAllRecipes() {
  try {
    await dbConnect();
    const recipes = await Recipe.find({}).sort({ createdAt: -1 });

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
      createdAt: recipe.createdAt ? recipe.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: recipe.updatedAt ? recipe.updatedAt.toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}