import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';

export async function GET() {
  try {
    await dbConnect();

    const recipes = await Recipe.find({}).sort({ createdAt: -1 });

    return Response.json({
      success: true,
      data: recipes,
      count: recipes.length
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch recipes'
      },
      { status: 500 }
    );
  }
}