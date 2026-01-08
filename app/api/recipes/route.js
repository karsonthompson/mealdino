import { getAllRecipes } from '@/lib/recipes';

export async function GET() {
  try {
    const recipes = await getAllRecipes();

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