import { auth } from '@/auth';
import { saveMealPlan } from '@/lib/mealPlans';

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

    const updated = await saveMealPlan(date, session.user.id, meals, cookingSessions);

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error saving meal plan day:', error);
    return Response.json({ success: false, message: 'Failed to save meal plan day' }, { status: 500 });
  }
}
