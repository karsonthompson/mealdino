import { getAllRecipes, createUserRecipe } from '@/lib/recipes';
import { auth } from '@/auth';

export async function GET() {
  try {
    // Get user session to show user's recipes + global recipes
    const session = await auth();
    const userId = session?.user?.id || null;

    const recipes = await getAllRecipes(userId);

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

export async function POST(request) {
  try {
    // Check authentication
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
    const recipeData = await request.json();

    // Validate required fields
    const { title, description, category, prepTime, ingredients, instructions, macros } = recipeData;
    if (!title || !description || !category || !prepTime || !ingredients || !instructions || !macros) {
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: title, description, category, prepTime, ingredients, instructions, macros'
        },
        { status: 400 }
      );
    }

    const parsedRecipeServings = Number(recipeData.recipeServings);
    recipeData.recipeServings = Number.isFinite(parsedRecipeServings) && parsedRecipeServings > 0
      ? parsedRecipeServings
      : 1;

    const newRecipe = await createUserRecipe(userId, recipeData);

    return Response.json({
      success: true,
      data: newRecipe,
      message: 'Recipe created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating recipe:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to create recipe'
      },
      { status: 500 }
    );
  }
}
