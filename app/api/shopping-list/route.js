import { auth } from '@/auth';
import { getMealPlansByDateRange, formatDateForDB } from '@/lib/mealPlans';
import { buildShoppingList } from '@/lib/shoppingList';
import { getShoppingChecklist } from '@/lib/shoppingChecklist';
import { getAisleOverrides } from '@/lib/ingredientPreferences';

function getDefaultDateRange() {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 13);

  return {
    startDate: formatDateForDB(start),
    endDate: formatDateForDB(end)
  };
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
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const includeMeals = searchParams.get('includeMeals') !== 'false';
    const includeCookingSessions = searchParams.get('includeCookingSessions') !== 'false';

    const defaults = getDefaultDateRange();
    const start = startDate || defaults.startDate;
    const end = endDate || defaults.endDate;

    const mealPlans = await getMealPlansByDateRange(start, end, userId);
    const shoppingList = buildShoppingList(mealPlans, { includeMeals, includeCookingSessions });
    const checklist = await getShoppingChecklist({
      userId,
      startDate: start,
      endDate: end,
      includeMeals,
      includeCookingSessions
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
        includeMeals,
        includeCookingSessions,
        mealPlanCount: mealPlans.length,
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
