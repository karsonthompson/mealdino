import AgentMessage from '@/models/AgentMessage';
import { getAllRecipes, createUserRecipe } from '@/lib/recipes';
import { buildShoppingList } from '@/lib/shoppingList';
import { validateAgentDraft } from '@/lib/agentValidation';

function expandDateRange(start, end) {
  const days = [];
  const cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (cursor <= endDate && days.length < 35) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function estimateNutritionTargets(profile) {
  const metrics = profile?.profileMetrics || {};
  if (!metrics.weightKg || !metrics.heightCm || !metrics.age) return null;

  const sexFactor = metrics.sex === 'female' ? -161 : 5;
  const bmr = (10 * Number(metrics.weightKg)) + (6.25 * Number(metrics.heightCm)) - (5 * Number(metrics.age)) + sexFactor;
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
    unspecified: 1.4
  };
  const maintenance = Math.max(1200, Math.round(bmr * (multipliers[metrics.activityLevel] || 1.4)));

  return {
    source: 'estimated',
    calories: maintenance,
    protein: Math.round((maintenance * 0.3) / 4),
    carbs: Math.round((maintenance * 0.4) / 4),
    fat: Math.round((maintenance * 0.3) / 9)
  };
}

function parseMealTypesFromText(text) {
  const joined = String(text || '').toLowerCase();
  const mealTypes = [];
  if (joined.includes('breakfast')) mealTypes.push('breakfast');
  if (joined.includes('lunch')) mealTypes.push('lunch');
  if (joined.includes('dinner')) mealTypes.push('dinner');
  if (joined.includes('snack')) mealTypes.push('snack');
  return mealTypes.length > 0 ? mealTypes : ['lunch', 'dinner'];
}

function parseDirectiveJson(raw) {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function toCompactRecipes(recipes) {
  return (recipes || []).slice(0, 120).map((recipe) => ({
    id: String(recipe._id),
    title: recipe.title,
    category: recipe.category,
    prepTime: recipe.prepTime,
    servings: recipe.recipeServings || 1,
    isGlobal: !!recipe.isGlobal
  }));
}

function normalizeMealTypes(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => ['breakfast', 'lunch', 'dinner', 'snack'].includes(v));
}

async function inferDirectivesWithFunctionCalling({
  userId,
  messages,
  profile,
  dateRange,
  revisionInstruction,
  candidateRecipes,
  createdRecipes,
  toolTrace
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_AGENT_MODEL || 'gpt-4o-mini';
  const conversationSummary = messages.slice(-12).map((m) => `${m.role}: ${m.content}`).join('\n');
  const systemText = [
    'You are MealDino planning agent.',
    'Use tool calls only when you must create a new recipe.',
    'When done, return ONLY JSON with schema:',
    '{"mealTypes":["breakfast"|"lunch"|"dinner"|"snack"],"selectedRecipeIds":[string],"strictness":"flexible"|"balanced"|"strict","notes":[string],"whyThisPlan":string}',
    'Keep notes concise.'
  ].join(' ');

  const baseMessages = [
    { role: 'system', content: systemText },
    {
      role: 'user',
      content: [
        `Date range: ${dateRange.start} to ${dateRange.end}`,
        `Profile: ${JSON.stringify({
          goal: profile?.optimizationGoal || '',
          strictness: profile?.strictness || 'balanced',
          hardConstraints: profile?.hardConstraints || [],
          softPreferences: profile?.softPreferences || [],
          nutritionTargets: profile?.nutritionTargets || {},
          preferences: profile?.planPreferences || {}
        })}`,
        `Candidate recipes (use these first): ${JSON.stringify(toCompactRecipes(candidateRecipes))}`,
        revisionInstruction ? `Revision request: ${revisionInstruction}` : '',
        `Recent conversation:\n${conversationSummary}`
      ].filter(Boolean).join('\n\n')
    }
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'create_recipe',
        description: 'Create a new recipe when existing recipes cannot satisfy constraints.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
            prepTime: { type: 'number' },
            recipeServings: { type: 'number' },
            ingredients: { type: 'array', items: { type: 'string' } },
            instructions: { type: 'array', items: { type: 'string' } },
            macros: {
              type: 'object',
              properties: {
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fat: { type: 'number' }
              },
              required: ['calories', 'protein', 'carbs', 'fat'],
              additionalProperties: false
            }
          },
          required: ['title', 'description', 'category', 'prepTime', 'recipeServings', 'ingredients', 'instructions', 'macros'],
          additionalProperties: false
        }
      }
    }
  ];

  const workingMessages = [...baseMessages];

  for (let step = 0; step < 3; step += 1) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: 350,
        response_format: { type: 'json_object' },
        messages: workingMessages,
        tools,
        tool_choice: 'auto'
      })
    });

    if (!response.ok) return null;
    const payload = await response.json();
    const assistantMessage = payload?.choices?.[0]?.message;
    if (!assistantMessage) return null;

    if (Array.isArray(assistantMessage.tool_calls) && assistantMessage.tool_calls.length > 0) {
      workingMessages.push({
        role: 'assistant',
        content: assistantMessage.content || '',
        tool_calls: assistantMessage.tool_calls
      });

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall?.function?.name;
        const rawArgs = toolCall?.function?.arguments || '{}';
        let toolOutput = {};

        if (toolName === 'create_recipe') {
          try {
            const args = JSON.parse(rawArgs);
            const created = await createUserRecipe(userId, {
              title: String(args.title || 'Agent Recipe').slice(0, 100),
              description: String(args.description || 'Generated by agent').slice(0, 500),
              category: ['breakfast', 'lunch', 'dinner', 'snack'].includes(args.category) ? args.category : 'lunch',
              prepTime: Number.isFinite(Number(args.prepTime)) ? Math.max(1, Number(args.prepTime)) : 25,
              recipeServings: Number.isFinite(Number(args.recipeServings)) ? Math.max(1, Number(args.recipeServings)) : 2,
              ingredients: Array.isArray(args.ingredients) ? args.ingredients.map((v) => String(v).trim()).filter(Boolean) : [],
              instructions: Array.isArray(args.instructions) ? args.instructions.map((v) => String(v).trim()).filter(Boolean) : [],
              macros: {
                calories: Number(args?.macros?.calories) || 0,
                protein: Number(args?.macros?.protein) || 0,
                carbs: Number(args?.macros?.carbs) || 0,
                fat: Number(args?.macros?.fat) || 0
              },
              imageUrl: 'https://via.placeholder.com/400x300?text=Recipe+Image'
            });

            candidateRecipes.push(created);
            createdRecipes.push(created);
            toolOutput = {
              createdRecipe: {
                id: String(created._id),
                title: created.title,
                category: created.category
              }
            };
            toolTrace.push({ tool: 'function.create_recipe', recipeId: String(created._id), title: created.title });
          } catch (error) {
            toolOutput = { error: 'Failed to create recipe' };
            toolTrace.push({ tool: 'function.create_recipe', error: true });
          }
        } else {
          toolOutput = { error: `Unsupported tool: ${toolName}` };
          toolTrace.push({ tool: 'function.unknown', name: toolName || 'unknown' });
        }

        workingMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolOutput)
        });
      }

      continue;
    }

    const parsed = parseDirectiveJson(assistantMessage.content || '');
    if (!parsed) return null;
    parsed.mealTypes = normalizeMealTypes(parsed.mealTypes);
    return parsed;
  }

  return null;
}

function getBatchDaysPerCook(profile) {
  const leftovers = profile?.planPreferences?.leftoversPreference || 'moderate';
  if (leftovers === 'heavy') return 5;
  if (leftovers === 'moderate') return 3;
  if (leftovers === 'light') return 2;
  return 1;
}

function getPrimaryBatchMealType(mealTypes) {
  if (mealTypes.includes('dinner')) return 'dinner';
  if (mealTypes.includes('lunch')) return 'lunch';
  return mealTypes[0] || 'dinner';
}

function buildMealPlanDays(days, mealTypes, planningRecipes, avoidRepeatMeals, defaultServings, profile) {
  const previousRecipeByMealType = new Map();
  const dayEntries = new Map(days.map((date) => [date, { date, meals: [], cookingSessions: [] }]));
  let cursor = 0;
  let intentionalRepeatSlots = 0;

  const pickRecipe = (mealType, usedThisDay) => {
    if (planningRecipes.length === 0) return null;

    const targetAttempts = planningRecipes.length;
    for (let i = 0; i < targetAttempts; i += 1) {
      const idx = (cursor + i) % planningRecipes.length;
      const candidate = planningRecipes[idx];
      const candidateId = String(candidate._id);
      const prevId = previousRecipeByMealType.get(mealType);

      if (!avoidRepeatMeals) {
        cursor = idx + 1;
        return candidate;
      }

      if (prevId && prevId === candidateId) continue;
      if (usedThisDay.has(candidateId)) continue;
      cursor = idx + 1;
      return candidate;
    }

    const fallback = planningRecipes[cursor % planningRecipes.length];
    cursor += 1;
    return fallback;
  };

  const batchCookingEnabled = getBatchDaysPerCook(profile) > 1
    && mealTypes.length > 0
    && planningRecipes.length > 0;
  const batchDaysPerCook = getBatchDaysPerCook(profile);
  const primaryBatchMealType = getPrimaryBatchMealType(mealTypes);
  const plannedPerMealServings = Math.min(4, Math.max(1, Number(defaultServings) || 1));

  const batchRecipeByDate = new Map();
  const usedRecipeForBatch = new Set();

  if (batchCookingEnabled) {
    for (let startIndex = 0; startIndex < days.length; startIndex += batchDaysPerCook) {
      const anchorDate = days[startIndex];
      const anchorEntry = dayEntries.get(anchorDate);
      if (!anchorEntry) continue;

      const recipe = pickRecipe(primaryBatchMealType, usedRecipeForBatch);
      if (!recipe) continue;

      const recipeId = String(recipe._id);
      usedRecipeForBatch.add(recipeId);
      previousRecipeByMealType.set(primaryBatchMealType, recipeId);

      const coverageCount = Math.min(batchDaysPerCook, days.length - startIndex);
      const batchCookServings = Math.min(20, Math.max(2, coverageCount * plannedPerMealServings));

      anchorEntry.cookingSessions.push({
        recipe: recipe._id,
        notes: `Batch cook for ${coverageCount} ${primaryBatchMealType} meals`,
        timeSlot: 'afternoon',
        servings: batchCookServings,
        plannedServings: batchCookServings,
        excludeFromShopping: false,
        purpose: 'meal_prep'
      });

      for (let offset = 0; offset < coverageCount; offset += 1) {
        const dayDate = days[startIndex + offset];
        if (!dayDate) continue;
        batchRecipeByDate.set(dayDate, {
          recipeId: recipe._id,
          source: offset === 0 ? 'fresh' : 'leftovers'
        });
      }
      intentionalRepeatSlots += Math.max(0, coverageCount - 1);
    }
  }

  days.forEach((date) => {
    const dayEntry = dayEntries.get(date);
    if (!dayEntry) return;
    const usedThisDay = new Set();

    const meals = mealTypes.map((mealType) => {
      if (mealType === primaryBatchMealType && batchRecipeByDate.has(date)) {
        const batchAssignment = batchRecipeByDate.get(date);
        usedThisDay.add(String(batchAssignment.recipeId));
        return {
          type: mealType,
          recipe: batchAssignment.recipeId,
          notes: batchAssignment.source === 'leftovers' ? 'Leftover portion from batch cook' : 'Fresh batch-cooked portion',
          source: batchAssignment.source,
          plannedServings: plannedPerMealServings,
          // Ingredients are accounted for by the batch cooking session.
          excludeFromShopping: true
        };
      }

      const recipe = pickRecipe(mealType, usedThisDay);
      if (!recipe) return null;

      const recipeId = String(recipe._id);
      usedThisDay.add(recipeId);
      previousRecipeByMealType.set(mealType, recipeId);

      return {
        type: mealType,
        recipe: recipe._id,
        notes: 'Agent-generated draft',
        source: 'fresh',
        plannedServings: plannedPerMealServings,
        excludeFromShopping: false
      };
    }).filter(Boolean);

    dayEntry.meals = meals;
  });

  return {
    mealPlanDays: days.map((date) => dayEntries.get(date) || { date, meals: [], cookingSessions: [] }),
    intentionalRepeatSlots,
    batchCookingEnabled
  };
}

function getDefaultPlannedServings(profile) {
  const leftovers = profile?.planPreferences?.leftoversPreference || 'moderate';
  if (leftovers === 'heavy') return 3;
  if (leftovers === 'moderate') return 2;
  return 1;
}

function buildCookingSchedule(days, batchPreference) {
  const heavy = batchPreference === 'heavy';
  const moderate = batchPreference === 'moderate';

  return days.map((date, index) => {
    const batchDay = heavy ? index % 2 === 0 : moderate ? index % 3 === 0 : index % 5 === 0;
    return {
      date,
      timeSlot: batchDay ? 'afternoon' : 'evening',
      tasks: batchDay
        ? ['Batch cook proteins', 'Prep vegetables', 'Portion meals']
        : ['Cook planned meals', 'Prep next-day ingredients']
    };
  });
}

function selectCandidateRecipes(allRecipes, preferences) {
  return allRecipes.filter((recipe) => {
    if (!preferences.includeGlobalRecipes && recipe.isGlobal) return false;
    if (!preferences.includeUserRecipes && !recipe.isGlobal) return false;
    if (Number.isFinite(Number(preferences.maxCookTimeMinutes))
      && Number(preferences.maxCookTimeMinutes) > 0
      && Number(recipe.prepTime) > Number(preferences.maxCookTimeMinutes)) {
      return false;
    }
    return true;
  });
}

export async function runAgentPlanningTools({
  userId,
  runId,
  profile,
  dateRange,
  revisionInstruction
}) {
  const toolTrace = [];

  const messages = await AgentMessage.find({ runId, userId }).sort({ createdAt: 1 }).lean();
  toolTrace.push({ tool: 'get_run_messages', count: messages.length });

  const allRecipes = await getAllRecipes(userId);
  toolTrace.push({ tool: 'get_candidate_recipes', total: allRecipes.length });

  const preferences = profile?.planPreferences || {};
  const candidateRecipes = selectCandidateRecipes(allRecipes, preferences);
  toolTrace.push({ tool: 'filter_recipes', total: candidateRecipes.length });

  const createdRecipes = [];

  const directivesFromLLM = await inferDirectivesWithFunctionCalling({
    userId,
    messages,
    profile,
    dateRange,
    revisionInstruction,
    candidateRecipes,
    createdRecipes,
    toolTrace
  });

  if (candidateRecipes.length === 0 && preferences.allowGeneratedRecipes !== false) {
    const generatedRecipe = await createUserRecipe(userId, {
      title: 'Agent Chicken & Rice Bowl',
      description: 'Auto-generated recipe based on your profile constraints.',
      category: 'dinner',
      prepTime: 25,
      recipeServings: 2,
      ingredients: ['1 lb chicken breast', '2 cups rice', '2 cups broccoli', '1 tbsp olive oil', '1 tsp garlic powder'],
      instructions: ['Cook rice.', 'Cook seasoned chicken.', 'Steam broccoli.', 'Assemble and portion.'],
      macros: { calories: 640, protein: 48, carbs: 60, fat: 20 },
      imageUrl: 'https://via.placeholder.com/400x300?text=Recipe+Image'
    });
    candidateRecipes.push(generatedRecipe);
    createdRecipes.push(generatedRecipe);
    toolTrace.push({ tool: 'fallback.create_recipe', created: generatedRecipe.title });
  }

  if (candidateRecipes.length === 0) {
    throw new Error('No candidate recipes available for this run.');
  }

  const fallbackText = `${messages.map((m) => m.content).join('\n')}\n${revisionInstruction || ''}`;
  const mealTypes = Array.isArray(directivesFromLLM?.mealTypes) && directivesFromLLM.mealTypes.length > 0
    ? directivesFromLLM.mealTypes.filter((v) => ['breakfast', 'lunch', 'dinner', 'snack'].includes(v))
    : parseMealTypesFromText(fallbackText);
  const strictness = ['flexible', 'balanced', 'strict'].includes(directivesFromLLM?.strictness)
    ? directivesFromLLM.strictness
    : (profile?.strictness || 'balanced');
  const directiveNotes = Array.isArray(directivesFromLLM?.notes) ? directivesFromLLM.notes.slice(0, 5) : [];
  const requestedRecipeIds = Array.isArray(directivesFromLLM?.selectedRecipeIds)
    ? directivesFromLLM.selectedRecipeIds.map((v) => String(v))
    : [];
  let planningRecipes = candidateRecipes;
  const days = expandDateRange(dateRange.start, dateRange.end);
  if (requestedRecipeIds.length > 0) {
    const selected = candidateRecipes.filter((recipe) => requestedRecipeIds.includes(String(recipe._id)));
    if (selected.length > 0) {
      planningRecipes = selected;
    }
  }
  const avoidRepeatMeals = preferences.avoidRepeatMeals !== false;
  if (avoidRepeatMeals) {
    const desiredUnique = Math.min(days.length * Math.max(1, mealTypes.length), 20);
    if (planningRecipes.length < desiredUnique) {
      const additionalPool = candidateRecipes.filter(
        (recipe) => !planningRecipes.some((selected) => String(selected._id) === String(recipe._id))
      );
      planningRecipes = [...planningRecipes, ...additionalPool].slice(0, desiredUnique);
    }
  }
  toolTrace.push({
    tool: 'infer_directives',
    via: directivesFromLLM ? 'function_calling_llm' : 'fallback',
    mealTypes,
    strictness,
    recipePool: planningRecipes.length,
    avoidRepeatMeals
  });

  const defaultPlannedServings = getDefaultPlannedServings(profile);
  const {
    mealPlanDays,
    intentionalRepeatSlots,
    batchCookingEnabled
  } = buildMealPlanDays(
    days,
    mealTypes,
    planningRecipes,
    avoidRepeatMeals,
    defaultPlannedServings,
    profile
  );
  toolTrace.push({
    tool: 'build_meal_plan',
    days: mealPlanDays.length,
    batchCookingEnabled,
    intentionalRepeatSlots
  });

  const recipeCatalogMap = new Map(planningRecipes.map((recipe) => [String(recipe._id), recipe]));
  const populatedDays = mealPlanDays.map((day) => ({
    date: day.date,
    meals: day.meals.map((meal) => ({
      ...meal,
      recipe: recipeCatalogMap.get(String(meal.recipe))
    })),
    cookingSessions: (day.cookingSessions || []).map((session) => ({
      ...session,
      recipe: recipeCatalogMap.get(String(session.recipe))
    }))
  }));

  const shoppingDraft = buildShoppingList(populatedDays, {
    includeMeals: true,
    includeCookingSessions: true
  });
  toolTrace.push({ tool: 'build_shopping_list', itemCount: shoppingDraft?.totals?.length || 0 });

  const cookingSchedule = buildCookingSchedule(days, preferences.batchCookingPreference);
  toolTrace.push({ tool: 'build_cooking_schedule', dayCount: cookingSchedule.length });

  const recipeCatalog = Array.from(recipeCatalogMap.values()).map((recipe) => ({
    _id: recipe._id,
    title: recipe.title,
    prepTime: recipe.prepTime,
    ingredients: recipe.ingredients || [],
    recipeServings: recipe.recipeServings || 1,
    isGlobal: recipe.isGlobal
  }));

  const validation = validateAgentDraft(profile, recipeCatalog);
  const slotCount = days.length * Math.max(1, mealTypes.length);
  const effectiveVarietySlots = Math.max(0, slotCount - intentionalRepeatSlots);
  const repeatPressure = avoidRepeatMeals && planningRecipes.length < effectiveVarietySlots;
  toolTrace.push({
    tool: 'validate_constraints',
    pass: validation.hardConstraintPass,
    violations: validation.hardConstraintViolations.length
  });

  const nutritionTargets = profile?.nutritionTargets?.source === 'user'
    ? profile.nutritionTargets
    : estimateNutritionTargets(profile);

  return {
    outputDraft: {
      mealPlanDays,
      shoppingList: shoppingDraft,
      cookingSchedule,
      createdRecipes: createdRecipes.map((recipe) => ({ _id: recipe._id, title: recipe.title })),
      recipeCatalog,
      validation,
      toolTrace
    },
    summary: {
      whyThisPlan: String(directivesFromLLM?.whyThisPlan || `Built a ${days.length}-day plan with ${mealTypes.join(', ')} meals using ${strictness} strictness.`),
      unmetConstraints: validation.hardConstraintViolations,
      notes: [
        ...directiveNotes,
        ...(repeatPressure
          ? ['Not enough unique recipes to avoid all repeats; add more recipes or allow generation for better variety.']
          : []),
        ...(batchCookingEnabled
          ? [`Batch cooking enabled: one prep can cover up to ${getBatchDaysPerCook(profile)} days for ${getPrimaryBatchMealType(mealTypes)}.`]
          : []),
        nutritionTargets
          ? `Nutrition target source: ${nutritionTargets.source}${nutritionTargets.calories ? ` (${nutritionTargets.calories} kcal)` : ''}`
          : 'Nutrition targets unavailable; add profile metrics or explicit targets.'
      ].filter(Boolean)
    }
  };
}
