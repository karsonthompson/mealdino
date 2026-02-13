import { auth } from '@/auth';
import Collection from '@/models/Collection';
import Recipe from '@/models/Recipe';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Force this route to use Node.js runtime instead of Edge runtime
export const runtime = 'nodejs';

// POST /api/collections/[id]/recipes - Add recipe to collection
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json(
        {
          success: false,
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid collection ID'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return Response.json(
        {
          success: false,
          message: 'Valid recipe ID is required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // Find the collection
    const collection = await Collection.findOne({ _id: id, userId });

    if (!collection) {
      return Response.json(
        {
          success: false,
          message: 'Collection not found'
        },
        { status: 404 }
      );
    }

    // Verify the recipe exists and user has access to it
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return Response.json(
        {
          success: false,
          message: 'Recipe not found'
        },
        { status: 404 }
      );
    }

    // Check if user has access to this recipe (either they own it or it's global)
    if (!recipe.isGlobal && recipe.userId?.toString() !== userId) {
      return Response.json(
        {
          success: false,
          message: 'Access denied to this recipe'
        },
        { status: 403 }
      );
    }

    // Check if recipe is already in the collection
    const alreadyInCollection = collection.recipes.some((id) => id?.equals?.(recipeId));
    if (alreadyInCollection) {
      return Response.json(
        {
          success: false,
          message: 'Recipe is already in this collection'
        },
        { status: 409 }
      );
    }

    // Add recipe to collection
    await collection.addRecipe(recipeId);

    // Populate and return updated collection
    await collection.populate('recipes', 'title description imageUrl category prepTime macros ingredients instructions userId isGlobal createdAt updatedAt');

    const formattedCollection = {
      _id: collection._id.toString(),
      name: collection.name,
      description: collection.description,
      color: collection.color,
      isDefault: collection.isDefault,
      recipeCount: collection.recipes.length,
      recipes: collection.recipes.map(recipe => ({
        _id: recipe._id.toString(),
        title: recipe.title,
        description: recipe.description || '',
        imageUrl: recipe.imageUrl,
        category: recipe.category,
        prepTime: Number(recipe.prepTime) || 0,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        macros: {
          calories: Number(recipe?.macros?.calories) || 0,
          protein: Number(recipe?.macros?.protein) || 0,
          carbs: Number(recipe?.macros?.carbs) || 0,
          fat: Number(recipe?.macros?.fat) || 0
        },
        userId: recipe.userId ? recipe.userId.toString() : null,
        isGlobal: recipe.isGlobal === true,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt
      })),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    };

    return Response.json({
      success: true,
      data: formattedCollection,
      message: `Recipe added to "${collection.name}" successfully`
    });
  } catch (error) {
    console.error('Error adding recipe to collection:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to add recipe to collection'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id]/recipes - Remove recipe from collection
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json(
        {
          success: false,
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid collection ID'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      return Response.json(
        {
          success: false,
          message: 'Valid recipe ID is required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // Find the collection
    const collection = await Collection.findOne({ _id: id, userId });

    if (!collection) {
      return Response.json(
        {
          success: false,
          message: 'Collection not found'
        },
        { status: 404 }
      );
    }

    // Check if recipe is in the collection
    const existsInCollection = collection.recipes.some((id) => id?.equals?.(recipeId));
    if (!existsInCollection) {
      return Response.json(
        {
          success: false,
          message: 'Recipe is not in this collection'
        },
        { status: 404 }
      );
    }

    // Remove recipe from collection
    await collection.removeRecipe(recipeId);

    // Populate and return updated collection
    await collection.populate('recipes', 'title description imageUrl category prepTime macros ingredients instructions userId isGlobal createdAt updatedAt');

    const formattedCollection = {
      _id: collection._id.toString(),
      name: collection.name,
      description: collection.description,
      color: collection.color,
      isDefault: collection.isDefault,
      recipeCount: collection.recipes.length,
      recipes: collection.recipes.map(recipe => ({
        _id: recipe._id.toString(),
        title: recipe.title,
        description: recipe.description || '',
        imageUrl: recipe.imageUrl,
        category: recipe.category,
        prepTime: Number(recipe.prepTime) || 0,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        macros: {
          calories: Number(recipe?.macros?.calories) || 0,
          protein: Number(recipe?.macros?.protein) || 0,
          carbs: Number(recipe?.macros?.carbs) || 0,
          fat: Number(recipe?.macros?.fat) || 0
        },
        userId: recipe.userId ? recipe.userId.toString() : null,
        isGlobal: recipe.isGlobal === true,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt
      })),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    };

    return Response.json({
      success: true,
      data: formattedCollection,
      message: `Recipe removed from "${collection.name}" successfully`
    });
  } catch (error) {
    console.error('Error removing recipe from collection:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to remove recipe from collection'
      },
      { status: 500 }
    );
  }
}
