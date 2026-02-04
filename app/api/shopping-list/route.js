import { auth } from '@/auth';
import { getMealPlansByDateRange, formatDateForDB } from '@/lib/mealPlans';
import { buildShoppingList } from '@/lib/shoppingList';
import { getShoppingChecklist } from '@/lib/shoppingChecklist';
import { getAisleOverrides } from '@/lib/ingredientPreferences';
import { getAllRecipes } from '@/lib/recipes';

function getDefaultDateRange() {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 13);

  return {
    startDate: formatDateForDB(start),
    endDate: formatDateForDB(end)
  };
}

function parseSelectedRecipes(searchParams) {
  const raw = searchParams.get('selectedRecipes');
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => ({
        recipeId: String(entry?.recipeId || '').trim(),
        plannedServings: Number(entry?.plannedServings)
      }))
      .filter((entry) => entry.recipeId && Number.isFinite(entry.plannedServings) && entry.plannedServings > 0)
      .map((entry) => ({
        recipeId: entry.recipeId,
        plannedServings: Math.max(1, Math.round(entry.plannedServings * 100) / 100)
      }));
  } catch {
    return [];
  }
}

function buildRecipeSelectionSignature(selectedRecipes) {
  return selectedRecipes
    .slice()
    .sort((a, b) => a.recipeId.localeCompare(b.recipeId))
    .map((item) => `${item.recipeId}:${item.plannedServings}`)
    .join(',');
}

export async function GET(request) {
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

    if (!userId) {
      return Response.json(
        {
          success: false,
          message: 'User ID not found in session'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') === 'recipes' ? 'recipes' : 'plan';
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const includeMeals = searchParams.get('includeMeals') !== 'false';
    const includeCookingSessions = searchParams.get('includeCookingSessions') !== 'false';
    const selectedRecipes = parseSelectedRecipes(searchParams);

    const defaults = getDefaultDateRange();
    const fallbackStart = startDate || defaults.startDate;
    const fallbackEnd = endDate || defaults.endDate;

    let start = fallbackStart;
    let end = fallbackEnd;
    let effectiveIncludeMeals = includeMeals;
    let effectiveIncludeCookingSessions = includeCookingSessions;
    let mealPlans = [];

    if (source === 'recipes') {
      if (selectedRecipes.length === 0) {
        return Response.json(
          {
            success: false,
            message: 'Select at least one recipe to generate a shopping list.'
          },
          { status: 400 }
        );
      }

      const allRecipes = await getAllRecipes(userId);
      const recipeMap = new Map(allRecipes.map((recipe) => [recipe._id, recipe]));

      const selectedMeals = selectedRecipes
        .map((entry) => ({
          recipe: recipeMap.get(entry.recipeId),
          plannedServings: entry.plannedServings,
          excludeFromShopping: false
        }))
        .filter((entry) => !!entry.recipe);

      if (selectedMeals.length === 0) {
        return Response.json(
          {
            success: false,
            message: 'None of the selected recipes are available for your account.'
          },
          { status: 400 }
        );
      }

      const recipeSignature = buildRecipeSelectionSignature(selectedRecipes);
      start = 'selected-recipes';
      end = recipeSignature;
      effectiveIncludeMeals = true;
      effectiveIncludeCookingSessions = false;
      mealPlans = [
        {
          date: 'Selected Recipes',
          meals: selectedMeals,
          cookingSessions: []
        }
      ];
    } else {
      mealPlans = await getMealPlansByDateRange(start, end, userId);
    }

    const shoppingList = buildShoppingList(mealPlans, {
      includeMeals: effectiveIncludeMeals,
      includeCookingSessions: effectiveIncludeCookingSessions
    });
    const checklist = await getShoppingChecklist({
      userId,
      startDate: start,
      endDate: end,
      includeMeals: effectiveIncludeMeals,
      includeCookingSessions: effectiveIncludeCookingSessions
    });
    const aisleOverrides = await getAisleOverrides(userId);

    const totalsWithOverrides = shoppingList.totals.map((item) => ({
      ...item,
      aisle: aisleOverrides[item.normalizedName] || item.aisle || 'Other'
    }));
    const needsReviewWithOverrides = shoppingList.needsReview.map((item) => ({
      ...item,
      aisle: aisleOverrides[item.normalizedName] || item.aisle || 'Other'
    }));

    return Response.json({
      success: true,
      data: {
        dateRange: { start, end },
        includeMeals: effectiveIncludeMeals,
        includeCookingSessions: effectiveIncludeCookingSessions,
        source,
        mealPlanCount: source === 'recipes' ? 0 : mealPlans.length,
        selectedRecipeCount: source === 'recipes' ? selectedRecipes.length : 0,
        checkedKeys: checklist.checkedKeys,
        manualItems: checklist.manualItems,
        totals: totalsWithOverrides,
        needsReview: needsReviewWithOverrides,
        stats: shoppingList.stats
      }
    });
  } catch (error) {
    console.error('Error building shopping list:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to build shopping list'
      },
      { status: 500 }
    );
  }
}
