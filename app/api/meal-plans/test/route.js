import { auth } from '@/auth';
import { getMealPlanByDate, addMealToPlan, formatDateForDB } from '@/lib/mealPlans';
import { getAllRecipes } from '@/lib/recipes';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    if (process.env.NODE_ENV !== 'development') {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const userId = session.user.id;

    // Get today's date in the right format
    const today = formatDateForDB(new Date());

    // Try to get existing meal plan
    let mealPlan = await getMealPlanByDate(today, userId);

    // If no meal plan exists, create a test one
    if (!mealPlan) {
      // Get a recipe to use for testing
      const recipes = await getAllRecipes(userId);

      if (recipes.length > 0) {
        const testRecipe = recipes[0]; // Use the first recipe

        // Add a test meal
        const testMeal = {
          type: 'lunch',
          recipe: testRecipe._id,
          notes: 'Test meal added automatically',
          source: 'fresh'
        };

        mealPlan = await addMealToPlan(today, userId, testMeal);
      }
    }

    return Response.json({
      success: true,
      message: 'Meal plan database test successful',
      data: {
        date: today,
        mealPlan: mealPlan,
        hasData: mealPlan !== null
      }
    });
  } catch (error) {
    console.error('Error testing meal plan database:', error);
    return Response.json(
      {
        success: false,
        message: 'Meal plan database test failed'
      },
      { status: 500 }
    );
  }
}
