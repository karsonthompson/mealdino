import { auth } from '@/auth';
import { createUserRecipe } from '@/lib/recipes';

function sanitizeDraft(draft) {
  const title = String(draft?.title || '').trim().slice(0, 100);
  const description = String(draft?.description || '').trim().slice(0, 500);
  const category = ['breakfast', 'lunch', 'dinner', 'snack'].includes(draft?.category)
    ? draft.category
    : 'lunch';
  const prepTime = Number(draft?.prepTime) > 0 ? Number(draft.prepTime) : 30;
  const recipeServings = Number(draft?.recipeServings) > 0 ? Number(draft.recipeServings) : 1;
  const ingredients = Array.isArray(draft?.ingredients)
    ? draft.ingredients.map((v) => String(v).trim()).filter(Boolean)
    : [];
  const instructions = Array.isArray(draft?.instructions)
    ? draft.instructions.map((v) => String(v).trim()).filter(Boolean)
    : [];

  if (!title || !description || ingredients.length === 0 || instructions.length === 0) {
    return null;
  }

  return {
    title,
    description,
    category,
    prepTime,
    recipeServings,
    ingredients,
    instructions,
    macros: {
      calories: Number(draft?.macros?.calories) || 0,
      protein: Number(draft?.macros?.protein) || 0,
      carbs: Number(draft?.macros?.carbs) || 0,
      fat: Number(draft?.macros?.fat) || 0
    },
    imageUrl: String(draft?.imageUrl || 'https://via.placeholder.com/400x300?text=Recipe+Image')
  };
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const drafts = Array.isArray(body?.drafts) ? body.drafts : [];

    if (drafts.length === 0) {
      return Response.json({ success: false, message: 'No drafts provided' }, { status: 400 });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < drafts.length; i += 1) {
      const sanitized = sanitizeDraft(drafts[i]);
      if (!sanitized) {
        errors.push({ index: i, message: 'Invalid or incomplete recipe draft' });
        continue;
      }

      try {
        const recipe = await createUserRecipe(session.user.id, sanitized);
        created.push(recipe);
      } catch (error) {
        errors.push({ index: i, message: 'Failed to save recipe' });
      }
    }

    return Response.json({
      success: true,
      data: {
        created,
        errors,
        createdCount: created.length,
        errorCount: errors.length
      }
    });
  } catch (error) {
    console.error('Error importing recipes:', error);
    return Response.json({ success: false, message: 'Failed to import recipes' }, { status: 500 });
  }
}
