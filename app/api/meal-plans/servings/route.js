import { auth } from '@/auth';
import { updatePlannedServings } from '@/lib/mealPlans';

export async function PATCH(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { date, entryType, index, plannedServings } = data;

    if (!date || (entryType !== 'meal' && entryType !== 'cooking_session')) {
      return Response.json(
        { success: false, message: 'Invalid payload. Expected date and entryType.' },
        { status: 400 }
      );
    }

    const parsedIndex = Number(index);
    const parsedServings = Number(plannedServings);

    if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
      return Response.json(
        { success: false, message: 'Invalid index' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(parsedServings) || parsedServings <= 0) {
      return Response.json(
        { success: false, message: 'Invalid plannedServings' },
        { status: 400 }
      );
    }

    const updatedPlan = await updatePlannedServings(
      date,
      session.user.id,
      entryType,
      parsedIndex,
      parsedServings
    );

    return Response.json({ success: true, data: updatedPlan });
  } catch (error) {
    console.error('Error updating servings:', error);
    return Response.json({ success: false, message: 'Failed to update servings' }, { status: 500 });
  }
}
