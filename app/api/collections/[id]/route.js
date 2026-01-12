import { auth } from '@/auth';
import Collection from '@/models/Collection';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Force this route to use Node.js runtime instead of Edge runtime
export const runtime = 'nodejs';

// GET /api/collections/[id] - Get single collection
export async function GET(request, { params }) {
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

    await dbConnect();

    const userId = session.user.id;
    
    // Validate and convert userId to ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid user ID format'
        },
        { status: 400 }
      );
    }

    const userIdObjectId = new mongoose.Types.ObjectId(userId);
    const collection = await Collection.findOne({ _id: id, userId: userIdObjectId })
      .populate('recipes', 'title imageUrl category prepTime macros isGlobal createdAt')
      .lean();

    if (!collection) {
      return Response.json(
        {
          success: false,
          message: 'Collection not found'
        },
        { status: 404 }
      );
    }

    // Format the collection
    const formattedCollection = {
      _id: collection._id.toString(),
      name: collection.name,
      description: collection.description,
      color: collection.color,
      isDefault: collection.isDefault,
      recipeCount: collection.recipes ? collection.recipes.length : 0,
      recipes: collection.recipes?.map(recipe => ({
        _id: recipe._id.toString(),
        title: recipe.title,
        imageUrl: recipe.imageUrl,
        category: recipe.category,
        prepTime: recipe.prepTime,
        macros: recipe.macros,
        isGlobal: recipe.isGlobal,
        createdAt: recipe.createdAt
      })) || [],
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    };

    return Response.json({
      success: true,
      data: formattedCollection
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch collection'
      },
      { status: 500 }
    );
  }
}

// PUT /api/collections/[id] - Update collection
export async function PUT(request, { params }) {
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
    const { name, description, color } = body;

    await dbConnect();

    const userId = session.user.id;
    
    // Validate and convert userId to ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid user ID format'
        },
        { status: 400 }
      );
    }

    const userIdObjectId = new mongoose.Types.ObjectId(userId);

    // Find the collection
    const collection = await Collection.findOne({ _id: id, userId: userIdObjectId });

    if (!collection) {
      return Response.json(
        {
          success: false,
          message: 'Collection not found'
        },
        { status: 404 }
      );
    }

    // Prevent editing default collection names
    if (collection.isDefault && name && name.trim() !== collection.name) {
      return Response.json(
        {
          success: false,
          message: 'Cannot rename default collections'
        },
        { status: 400 }
      );
    }

    // Update fields if provided
    const updates = {};
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return Response.json(
          {
            success: false,
            message: 'Collection name is required'
          },
          { status: 400 }
        );
      }

      if (name.trim().length > 50) {
        return Response.json(
          {
            success: false,
            message: 'Collection name cannot be more than 50 characters'
          },
          { status: 400 }
        );
      }

      // Check if new name conflicts with existing collection
      if (name.trim() !== collection.name) {
        const existingCollection = await Collection.findOne({
          userId: userIdObjectId,
          name: name.trim(),
          _id: { $ne: id }
        });

        if (existingCollection) {
          return Response.json(
            {
              success: false,
              message: 'A collection with this name already exists'
            },
            { status: 409 }
          );
        }
      }

      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || '';
    }

    if (color !== undefined) {
      updates.color = color;
    }

    // Update the collection
    Object.assign(collection, updates);
    await collection.save();

    // Populate and return updated collection
    await collection.populate('recipes', 'title imageUrl category');

    const formattedCollection = {
      _id: collection._id.toString(),
      name: collection.name,
      description: collection.description,
      color: collection.color,
      isDefault: collection.isDefault,
      recipeCount: collection.recipes ? collection.recipes.length : 0,
      recipes: collection.recipes?.map(recipe => ({
        _id: recipe._id.toString(),
        title: recipe.title,
        imageUrl: recipe.imageUrl,
        category: recipe.category
      })) || [],
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    };

    return Response.json({
      success: true,
      data: formattedCollection,
      message: 'Collection updated successfully'
    });
  } catch (error) {
    console.error('Error updating collection:', error);

    if (error.code === 11000) {
      return Response.json(
        {
          success: false,
          message: 'A collection with this name already exists'
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        message: 'Failed to update collection'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id] - Delete collection
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

    await dbConnect();

    const userId = session.user.id;
    
    // Validate and convert userId to ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid user ID format'
        },
        { status: 400 }
      );
    }

    const userIdObjectId = new mongoose.Types.ObjectId(userId);
    const collection = await Collection.findOne({ _id: id, userId: userIdObjectId });

    if (!collection) {
      return Response.json(
        {
          success: false,
          message: 'Collection not found'
        },
        { status: 404 }
      );
    }

    // Prevent deletion of default collections
    if (collection.isDefault) {
      return Response.json(
        {
          success: false,
          message: 'Cannot delete default collections'
        },
        { status: 400 }
      );
    }

    await Collection.findByIdAndDelete(id);

    return Response.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to delete collection'
      },
      { status: 500 }
    );
  }
}