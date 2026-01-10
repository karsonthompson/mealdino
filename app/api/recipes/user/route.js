import { getUserRecipes, updateUserRecipe, deleteUserRecipe } from '@/lib/recipes';
import { auth } from '@/auth';

// Get user's own recipes only
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

    const userId = session.user.id;
    const recipes = await getUserRecipes(userId);

    return Response.json({
      success: true,
      data: recipes,
      count: recipes.length
    });
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch user recipes'
      },
      { status: 500 }
    );
  }
}

// Update user's recipe
export async function PUT(request) {
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

    const userId = session.user.id;
    const { recipeId, ...recipeData } = await request.json();

    if (!recipeId) {
      return Response.json(
        {
          success: false,
          message: 'Recipe ID is required'
        },
        { status: 400 }
      );
    }

    const updatedRecipe = await updateUserRecipe(recipeId, userId, recipeData);

    return Response.json({
      success: true,
      data: updatedRecipe,
      message: 'Recipe updated successfully'
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return Response.json(
      {
        success: false,
        message: error.message || 'Failed to update recipe'
      },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}

// Delete user's recipe
export async function DELETE(request) {
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

    const userId = session.user.id;
    const { recipeId } = await request.json();

    if (!recipeId) {
      return Response.json(
        {
          success: false,
          message: 'Recipe ID is required'
        },
        { status: 400 }
      );
    }

    await deleteUserRecipe(recipeId, userId);

    return Response.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return Response.json(
      {
        success: false,
        message: error.message || 'Failed to delete recipe'
      },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}