import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid recipe ID format'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return Response.json(
        {
          success: false,
          message: 'Recipe not found'
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch recipe'
      },
      { status: 500 }
    );
  }
}