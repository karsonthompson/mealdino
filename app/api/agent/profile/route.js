import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import AgentProfile from '@/models/AgentProfile';
import { checkAgentAccess } from '@/lib/agentAccess';

export const runtime = 'nodejs';

function sanitizeProfileInput(body) {
  return {
    medicalDisclaimerAcceptedAt: body?.medicalDisclaimerAcceptedAt ? new Date(body.medicalDisclaimerAcceptedAt) : null,
    optimizationGoal: String(body?.optimizationGoal || ''),
    strictness: ['flexible', 'balanced', 'strict'].includes(body?.strictness) ? body.strictness : 'balanced',
    hardConstraints: Array.isArray(body?.hardConstraints) ? body.hardConstraints.map((v) => String(v).trim()).filter(Boolean) : [],
    softPreferences: Array.isArray(body?.softPreferences) ? body.softPreferences.map((v) => String(v).trim()).filter(Boolean) : [],
    nutritionTargets: {
      source: ['user', 'estimated', 'none'].includes(body?.nutritionTargets?.source) ? body.nutritionTargets.source : 'none',
      calories: Number.isFinite(Number(body?.nutritionTargets?.calories)) ? Number(body.nutritionTargets.calories) : null,
      protein: Number.isFinite(Number(body?.nutritionTargets?.protein)) ? Number(body.nutritionTargets.protein) : null,
      carbs: Number.isFinite(Number(body?.nutritionTargets?.carbs)) ? Number(body.nutritionTargets.carbs) : null,
      fat: Number.isFinite(Number(body?.nutritionTargets?.fat)) ? Number(body.nutritionTargets.fat) : null
    },
    profileMetrics: {
      heightCm: Number.isFinite(Number(body?.profileMetrics?.heightCm)) ? Number(body.profileMetrics.heightCm) : null,
      weightKg: Number.isFinite(Number(body?.profileMetrics?.weightKg)) ? Number(body.profileMetrics.weightKg) : null,
      age: Number.isFinite(Number(body?.profileMetrics?.age)) ? Number(body.profileMetrics.age) : null,
      sex: ['female', 'male', 'other', 'unspecified'].includes(body?.profileMetrics?.sex) ? body.profileMetrics.sex : 'unspecified',
      activityLevel: ['sedentary', 'light', 'moderate', 'active', 'very_active', 'unspecified'].includes(body?.profileMetrics?.activityLevel)
        ? body.profileMetrics.activityLevel
        : 'unspecified'
    },
    budget: {
      enabled: Boolean(body?.budget?.enabled),
      weeklyAmount: Number.isFinite(Number(body?.budget?.weeklyAmount)) ? Number(body.budget.weeklyAmount) : null,
      currency: String(body?.budget?.currency || 'USD').toUpperCase()
    },
    planPreferences: {
      allowGeneratedRecipes: body?.planPreferences?.allowGeneratedRecipes !== false,
      includeGlobalRecipes: body?.planPreferences?.includeGlobalRecipes !== false,
      includeUserRecipes: body?.planPreferences?.includeUserRecipes !== false,
      avoidRepeatMeals: body?.planPreferences?.avoidRepeatMeals !== false,
      leftoversPreference: ['none', 'light', 'moderate', 'heavy'].includes(body?.planPreferences?.leftoversPreference)
        ? body.planPreferences.leftoversPreference
        : 'moderate',
      batchCookingPreference: ['none', 'light', 'moderate', 'heavy'].includes(body?.planPreferences?.batchCookingPreference)
        ? body.planPreferences.batchCookingPreference
        : 'moderate',
      maxCookTimeMinutes: Number.isFinite(Number(body?.planPreferences?.maxCookTimeMinutes))
        ? Number(body.planPreferences.maxCookTimeMinutes)
        : null
    }
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const access = await checkAgentAccess(session.user.id);
    if (!access.allowed) {
      return Response.json({ success: false, message: access.reason }, { status: 403 });
    }

    await dbConnect();
    const profile = await AgentProfile.findOne({ userId: session.user.id }).lean();

    return Response.json({
      success: true,
      data: profile || null
    });
  } catch (error) {
    console.error('Error fetching agent profile:', error);
    return Response.json({ success: false, message: 'Failed to fetch agent profile' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const access = await checkAgentAccess(session.user.id);
    if (!access.allowed) {
      return Response.json({ success: false, message: access.reason }, { status: 403 });
    }

    const body = await request.json();
    const sanitized = sanitizeProfileInput(body);

    await dbConnect();
    const updated = await AgentProfile.findOneAndUpdate(
      { userId: session.user.id },
      { userId: session.user.id, ...sanitized },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return Response.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error saving agent profile:', error);
    return Response.json({ success: false, message: 'Failed to save agent profile' }, { status: 500 });
  }
}
