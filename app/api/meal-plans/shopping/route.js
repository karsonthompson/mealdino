import { auth } from '@/auth';
import { updateExcludeFromShopping } from '@/lib/mealPlans';

export async function PATCH(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { date, entryType, index, excludeFromShopping } = data;

    if (!date || (entryType !== 'meal' && entryType !== 'cooking_session')) {
      return Response.json(
        { success: false, message: 'Invalid payload. Expected date and entryType.' },
        { status: 400 }
      );
    }

    const parsedIndex = Number(index);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
      return Response.json({ success: false, message: 'Invalid index' }, { status: 400 });
    }

    const updatedPlan = await updateExcludeFromShopping(
      date,
      session.user.id,
      entryType,
      parsedIndex,
      excludeFromShopping === true
    );

    return Response.json({ success: true, data: updatedPlan });
  } catch (error) {
    console.error('Error updating shopping exclusion:', error);
    return Response.json({ success: false, message: 'Failed to update shopping exclusion' }, { status: 500 });
  }
}
