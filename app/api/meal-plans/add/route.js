import { addMealToPlan, addCookingSessionToPlan } from '@/lib/mealPlans';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    // Get user session
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

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      console.error('User ID not found in session. Session structure:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userIdFromUser: session?.user?.id,
        fullSession: JSON.stringify(session, null, 2)
      });
      return Response.json(
        {
          success: false,
          message: 'User ID not found in session. Please try logging in again.'
        },
        { status: 401 }
      );
    }
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

      result = await addMealToPlan(date, userId, mealData);
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

      result = await addCookingSessionToPlan(date, userId, sessionData);
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