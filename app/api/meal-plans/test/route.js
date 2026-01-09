import { getMealPlanByDate, addMealToPlan, formatDateForDB } from '@/lib/mealPlans';
import { getAllRecipes } from '@/lib/recipes';

export async function GET() {
  try {
    // Get today's date in the right format
    const today = formatDateForDB(new Date());

    // Try to get existing meal plan
    let mealPlan = await getMealPlanByDate(today);

    // If no meal plan exists, create a test one
    if (!mealPlan) {
      // Get a recipe to use for testing
      const recipes = await getAllRecipes();

      if (recipes.length > 0) {
        const testRecipe = recipes[0]; // Use the first recipe

        // Add a test meal
        const testMeal = {
          type: 'lunch',
          recipe: testRecipe._id,
          notes: 'Test meal added automatically',
          source: 'fresh'
        };

        mealPlan = await addMealToPlan(today, testMeal);
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
        message: 'Meal plan database test failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}