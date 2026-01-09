import { addMealToPlan, addCookingSessionToPlan } from '@/lib/mealPlans';

export async function POST(request) {
  try {
    const data = await request.json();
    const { date, type, recipe_id, notes = '' } = data;

    // Validate required fields
    if (!date || !type || !recipe_id) {
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: date, type, recipe_id'
        },
        { status: 400 }
      );
    }

    let result;

    if (type === 'meal') {
      // Add meal to plan
      const { meal_type = 'lunch', source = 'fresh' } = data;

      const mealData = {
        type: meal_type,
        recipe: recipe_id,
        notes,
        source
      };

      result = await addMealToPlan(date, mealData);
    } else if (type === 'cooking_session') {
      // Add cooking session to plan
      const {
        time_slot = 'afternoon',
        servings = 4,
        purpose = 'daily_cooking'
      } = data;

      const sessionData = {
        recipe: recipe_id,
        notes,
        timeSlot: time_slot,
        servings,
        purpose
      };

      result = await addCookingSessionToPlan(date, sessionData);
    } else {
      return Response.json(
        {
          success: false,
          message: 'Invalid type. Must be "meal" or "cooking_session"'
        },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      data: result,
      message: `${type === 'meal' ? 'Meal' : 'Cooking session'} added successfully`
    });

  } catch (error) {
    console.error('Error adding to meal plan:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to add to meal plan'
      },
      { status: 500 }
    );
  }
}