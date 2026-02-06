import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Collection from '@/models/Collection';
import MealPlan from '@/models/MealPlan';
import mongoose from 'mongoose';

function toIsoDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function getDatesInRange(startDate, endDate) {
  const dates = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeMealType(category) {
  if (category === 'breakfast' || category === 'lunch' || category === 'dinner' || category === 'snack') {
    return category;
  }
  return 'dinner';
}

const ALLOWED_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const collectionId = String(body.collectionId || '');
    const startDate = toIsoDate(String(body.startDate || ''));
    const endDate = toIsoDate(String(body.endDate || ''));
    const mealTypes = Array.isArray(body.mealTypes)
      ? body.mealTypes.filter((mealType) => ALLOWED_MEAL_TYPES.includes(mealType))
      : [];

    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      return Response.json({ success: false, message: 'Valid collection is required' }, { status: 400 });
    }

    if (!startDate || !endDate || startDate > endDate) {
      return Response.json({ success: false, message: 'Valid date range is required' }, { status: 400 });
    }

    if (mealTypes.length === 0) {
      return Response.json({ success: false, message: 'At least one meal type is required' }, { status: 400 });
    }

    await dbConnect();

    const collection = await Collection.findOne({
      _id: collectionId,
      userId: session.user.id
    }).populate('recipes', '_id category recipeServings');

    if (!collection) {
      return Response.json({ success: false, message: 'Collection not found' }, { status: 404 });
    }

    const recipes = (collection.recipes || []).filter((recipe) => recipe?._id);
    if (recipes.length === 0) {
      return Response.json({ success: false, message: 'Collection has no recipes to plan from' }, { status: 400 });
    }
    const recipesByMealType = {
      breakfast: recipes.filter((recipe) => normalizeMealType(recipe.category) === 'breakfast'),
      lunch: recipes.filter((recipe) => normalizeMealType(recipe.category) === 'lunch'),
      dinner: recipes.filter((recipe) => normalizeMealType(recipe.category) === 'dinner'),
      snack: recipes.filter((recipe) => normalizeMealType(recipe.category) === 'snack')
    };

    const targetDates = getDatesInRange(startDate, endDate);

    const existingPlans = await MealPlan.find({
      userId: session.user.id,
      date: { $gte: startDate, $lte: endDate }
    });
    const existingByDate = new Map(existingPlans.map((plan) => [plan.date, plan]));

    for (const date of targetDates) {
      const generatedMeals = mealTypes.map((mealType) => {
        const typePool = recipesByMealType[mealType];
        const selectedRecipe = typePool.length > 0 ? pickRandom(typePool) : pickRandom(recipes);
        return {
          type: mealType,
          recipe: selectedRecipe._id,
          notes: 'Auto-generated from collection',
          source: 'fresh',
          plannedServings: selectedRecipe.recipeServings || 1,
          excludeFromShopping: false
        };
      });

      const existing = existingByDate.get(date);
      if (existing) {
        existing.meals = generatedMeals;
        await existing.save();
      } else {
        await MealPlan.create({
          userId: session.user.id,
          date,
          meals: generatedMeals,
          cookingSessions: []
        });
      }
    }

    return Response.json({
      success: true,
      data: {
        datesUpdated: targetDates.length,
        startDate,
        endDate,
        mealTypes,
        collectionId
      }
    });
  } catch (error) {
    console.error('Error generating plan from collection:', error);
    return Response.json({ success: false, message: 'Failed to generate plan' }, { status: 500 });
  }
}
