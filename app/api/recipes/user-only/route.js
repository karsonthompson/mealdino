import { getUserRecipes } from '@/lib/recipes';
import { auth } from '@/auth';

// Get only user's own recipes (not global recipes)
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return Response.json({
        success: true,
        data: [],
        count: 0,
        message: 'Not authenticated - no user recipes available'
      });
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