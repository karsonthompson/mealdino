import { getMealPlansByDateRange, getCurrentWeekRange } from '@/lib/mealPlans';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    let start, end;

    if (startDate && endDate) {
      // Use provided date range
      start = startDate;
      end = endDate;
    } else {
      // Default to current week
      const weekRange = getCurrentWeekRange();
      start = weekRange.startDate;
      end = weekRange.endDate;
    }

    const mealPlans = await getMealPlansByDateRange(start, end);

    return Response.json({
      success: true,
      data: mealPlans,
      dateRange: { start, end },
      count: mealPlans.length
    });
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch meal plans'
      },
      { status: 500 }
    );
  }
}