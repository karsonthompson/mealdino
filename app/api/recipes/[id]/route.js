import { getRecipeById } from '@/lib/recipes';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const recipe = await getRecipeById(id);

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