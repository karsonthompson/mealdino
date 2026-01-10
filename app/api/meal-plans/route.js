import { getMealPlansByDateRange, getCurrentWeekRange } from '@/lib/mealPlans';
import { auth } from '@/auth';

export async function GET(request) {
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

    // Get user ID - NextAuth v5 with database sessions stores it as session.userId
    // or session.user.id. Convert to string to ensure compatibility.
    const userId = String(session.userId || session.user?.id || '');
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('User ID not found in session:', session);
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

    const mealPlans = await getMealPlansByDateRange(start, end, userId);

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