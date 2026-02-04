import { auth } from '@/auth';
import { getShoppingChecklist, upsertShoppingChecklist } from '@/lib/shoppingChecklist';
import { formatDateForDB } from '@/lib/mealPlans';

function getDefaultDateRange() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 13);

  return {
    start: formatDateForDB(startDate),
    end: formatDateForDB(endDate)
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

function getParams(request) {
  const { searchParams } = new URL(request.url);
  const defaults = getDefaultDateRange();
  const source = searchParams.get('source') === 'recipes' ? 'recipes' : 'plan';
  const selectedRecipes = parseSelectedRecipes(searchParams);

  if (source === 'recipes') {
    return {
      source,
      selectedRecipes,
      startDate: 'selected-recipes',
      endDate: buildRecipeSelectionSignature(selectedRecipes),
      includeMeals: true,
      includeCookingSessions: false
    };
  }

  return {
    source,
    selectedRecipes,
    startDate: searchParams.get('start') || defaults.start,
    endDate: searchParams.get('end') || defaults.end,
    includeMeals: searchParams.get('includeMeals') !== 'false',
    includeCookingSessions: searchParams.get('includeCookingSessions') !== 'false'
  };
}

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const params = getParams(request);
    const checklist = await getShoppingChecklist({
      userId: session.user.id,
      ...params
    });

    return Response.json({
      success: true,
      data: {
        ...params,
        ...checklist
      }
    });
  } catch (error) {
    console.error('Error fetching shopping checklist:', error);
    return Response.json({ success: false, message: 'Failed to fetch shopping checklist' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const params = getParams(request);
    const body = await request.json();
    const existing = await getShoppingChecklist({
      userId: session.user.id,
      ...params
    });

    const checklist = await upsertShoppingChecklist({
      userId: session.user.id,
      ...params,
      checkedKeys: Array.isArray(body.checkedKeys) ? body.checkedKeys : existing.checkedKeys || [],
      manualItems: Array.isArray(body.manualItems) ? body.manualItems : existing.manualItems || []
    });

    return Response.json({
      success: true,
      data: {
        ...params,
        ...checklist
      }
    });
  } catch (error) {
    console.error('Error saving shopping checklist:', error);
    return Response.json({ success: false, message: 'Failed to save shopping checklist' }, { status: 500 });
  }
}
