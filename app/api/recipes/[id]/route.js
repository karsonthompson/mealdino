import { getRecipeById, updateUserRecipe, deleteUserRecipe } from '@/lib/recipes';
import { auth } from '@/auth';

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
    const userId = session.user.id;
    const body = await request.json();

    if (body.recipeServings !== undefined) {
      const parsedRecipeServings = Number(body.recipeServings);
      body.recipeServings = Number.isFinite(parsedRecipeServings) && parsedRecipeServings > 0
        ? parsedRecipeServings
        : 1;
    }

    const updatedRecipe = await updateUserRecipe(id, userId, body);

    return Response.json({
      success: true,
      data: updatedRecipe,
      message: 'Recipe updated successfully'
    });
  } catch (error) {
    console.error('Error updating recipe:', error);

    if (error.message === 'Recipe not found or not owned by user') {
      return Response.json(
        {
          success: false,
          message: 'Recipe not found or you do not have permission to edit it'
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        success: false,
        message: 'Failed to update recipe'
      },
      { status: 500 }
    );
  }
}

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
    const userId = session.user.id;

    await deleteUserRecipe(id, userId);

    return Response.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);

    if (error.message === 'Recipe not found or not owned by user') {
      return Response.json(
        {
          success: false,
          message: 'Recipe not found or you do not have permission to delete it'
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        success: false,
        message: 'Failed to delete recipe'
      },
      { status: 500 }
    );
  }
}
