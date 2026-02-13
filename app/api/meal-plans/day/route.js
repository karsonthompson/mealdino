import { auth } from '@/auth';
import { saveMealPlan } from '@/lib/mealPlans';
import mongoose from 'mongoose';
import Recipe from '@/models/Recipe';
import dbConnect from '@/lib/mongodb';

function extractRecipeId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (typeof value._id === 'string') return value._id;
    if (typeof value.id === 'string') return value.id;
  }
  return null;
}

export async function PUT(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { date, meals = [], cookingSessions = [] } = body;

    if (!date) {
      return Response.json({ success: false, message: 'Date is required' }, { status: 400 });
    }

    if (!Array.isArray(meals) || !Array.isArray(cookingSessions)) {
      return Response.json(
        { success: false, message: 'meals and cookingSessions must be arrays' },
        { status: 400 }
      );
    }

    const mealRecipeIds = meals.map((meal) => extractRecipeId(meal?.recipe)).filter(Boolean);
    const cookingRecipeIds = cookingSessions.map((session) => extractRecipeId(session?.recipe)).filter(Boolean);
    const recipeIds = [...new Set([...mealRecipeIds, ...cookingRecipeIds])];

    if (recipeIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return Response.json({ success: false, message: 'Invalid recipe ID in payload' }, { status: 400 });
    }

    if (recipeIds.length > 0) {
      await dbConnect();
      const allowedCount = await Recipe.countDocuments({
        _id: { $in: recipeIds },
        $or: [{ isGlobal: true }, { userId: session.user.id }]
      });

      if (allowedCount !== recipeIds.length) {
        return Response.json(
          { success: false, message: 'One or more recipes are not accessible' },
          { status: 403 }
        );
      }
    }

    const updated = await saveMealPlan(date, session.user.id, meals, cookingSessions);

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error saving meal plan day:', error);
    return Response.json({ success: false, message: 'Failed to save meal plan day' }, { status: 500 });
  }
}
