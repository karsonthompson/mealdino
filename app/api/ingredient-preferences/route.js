import { auth } from '@/auth';
import { upsertAisleOverride } from '@/lib/ingredientPreferences';

export async function PUT(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { normalizedName, aisle } = body;

    if (!normalizedName || !aisle) {
      return Response.json(
        { success: false, message: 'normalizedName and aisle are required' },
        { status: 400 }
      );
    }

    const updated = await upsertAisleOverride(session.user.id, normalizedName, aisle);

    return Response.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating ingredient preference:', error);
    return Response.json({ success: false, message: 'Failed to update ingredient preference' }, { status: 500 });
  }
}
