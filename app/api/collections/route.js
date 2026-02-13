import { auth } from '@/auth';
import Collection from '@/models/Collection';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Force this route to use Node.js runtime instead of Edge runtime
export const runtime = 'nodejs';

// GET /api/collections - Get user's collections
export async function GET() {
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

    await dbConnect();

    const userId = session.user.id;
    
    // Validate and convert userId to ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId format:', userId);
      return Response.json(
        {
          success: false,
          message: 'Invalid user ID format'
        },
        { status: 400 }
      );
    }

    const userIdObjectId = new mongoose.Types.ObjectId(userId);

    // Ensure user has default collections
    await Collection.createDefaultCollections(userIdObjectId);

    // Get all collections for the user, sorted by sortOrder then creation date
    const collections = await Collection.find({ userId: userIdObjectId })
      .populate('recipes', 'title imageUrl category')
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    // Transform collections to include recipe count and format properly
    const formattedCollections = collections.map(collection => ({
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
    }));

    return Response.json({
      success: true,
      data: formattedCollections
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch collections',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create new collection
export async function POST(request) {
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

    const body = await request.json();
    const { name, description, color } = body;

    // Validation
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

    await dbConnect();

    const userId = session.user.id;

    // Validate and convert userId to ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId format:', userId);
      return Response.json(
        {
          success: false,
          message: 'Invalid user ID format. Please try logging in again.'
        },
        { status: 400 }
      );
    }

    const userIdObjectId = new mongoose.Types.ObjectId(userId);

    // Check if collection name already exists for this user
    const existingCollection = await Collection.findOne({
      userId: userIdObjectId,
      name: name.trim()
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

    // Get the highest sort order for new collection
    const lastCollection = await Collection.findOne({ userId: userIdObjectId }).sort({ sortOrder: -1 });
    const sortOrder = lastCollection ? lastCollection.sortOrder + 1 : 1;

    // Create new collection
    const newCollection = new Collection({
      userId: userIdObjectId,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#10B981',
      sortOrder,
      recipes: []
    });

    await newCollection.save();

    // Populate and return the created collection
    await newCollection.populate('recipes', 'title imageUrl category');

    const formattedCollection = {
      _id: newCollection._id.toString(),
      name: newCollection.name,
      description: newCollection.description,
      color: newCollection.color,
      isDefault: newCollection.isDefault,
      recipeCount: 0,
      recipes: [],
      createdAt: newCollection.createdAt,
      updatedAt: newCollection.updatedAt
    };

    return Response.json({
      success: true,
      data: formattedCollection,
      message: 'Collection created successfully'
    });
  } catch (error) {
    console.error('Error creating collection:', error);

    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      return Response.json(
        {
          success: false,
          message: 'A collection with this name already exists'
        },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err) => err.message).join(', ');
      return Response.json(
        {
          success: false,
          message: `Validation error: ${validationErrors}`,
          ...(process.env.NODE_ENV === 'development' && { details: error.errors })
        },
        { status: 400 }
      );
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return Response.json(
        {
          success: false,
          message: `Invalid data format: ${error.message}`,
          ...(process.env.NODE_ENV === 'development' && { path: error.path, value: error.value })
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: false,
        message: 'Failed to create collection',
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          errorName: error.name 
        })
      },
      { status: 500 }
    );
  }
}
