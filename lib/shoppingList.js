const UNIT_ALIASES = {
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  clove: 'clove',
  cloves: 'clove',
  can: 'can',
  cans: 'can',
  package: 'package',
  packages: 'package',
  slice: 'slice',
  slices: 'slice',
  piece: 'piece',
  pieces: 'piece'
};

const UNIT_FAMILIES = {
  tsp: 'volume',
  tbsp: 'volume',
  cup: 'volume',
  ml: 'volume',
  l: 'volume',
  g: 'weight',
  kg: 'weight',
  oz: 'weight',
  lb: 'weight'
};

const UNIT_TO_BASE = {
  // volume base = ml
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  ml: 1,
  l: 1000,
  // weight base = g
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592
};

const AISLE_RULES = [
  { aisle: 'Produce', keywords: ['apple', 'banana', 'orange', 'lettuce', 'spinach', 'kale', 'broccoli', 'carrot', 'onion', 'garlic', 'pepper', 'tomato', 'cucumber', 'avocado', 'potato', 'zucchini', 'lime', 'lemon', 'berries', 'cilantro', 'parsley'] },
  { aisle: 'Protein', keywords: ['chicken', 'beef', 'turkey', 'pork', 'salmon', 'tuna', 'shrimp', 'tofu', 'tempeh', 'beans', 'lentils', 'ground'] },
  { aisle: 'Dairy & Eggs', keywords: ['milk', 'yogurt', 'butter', 'cheese', 'cream', 'egg', 'parmesan', 'mozzarella', 'feta'] },
  { aisle: 'Grains & Bread', keywords: ['rice', 'pasta', 'bread', 'tortilla', 'oats', 'quinoa', 'flour', 'noodle', 'cereal'] },
  { aisle: 'Pantry', keywords: ['olive oil', 'oil', 'vinegar', 'soy sauce', 'sauce', 'broth', 'stock', 'can', 'canned', 'tomato paste', 'mustard', 'ketchup', 'mayo', 'sugar', 'salt', 'pepper', 'paprika', 'cumin', 'oregano', 'basil', 'spice'] },
  { aisle: 'Frozen', keywords: ['frozen'] },
  { aisle: 'Snacks', keywords: ['chips', 'cracker', 'nuts', 'trail mix'] },
  { aisle: 'Beverages', keywords: ['coffee', 'tea', 'juice', 'soda', 'water'] }
];

function parseFraction(value) {
  const [num, den] = value.split('/').map(Number);
  if (!num || !den) return null;
  return num / den;
}

function parseQuantity(value) {
  const trimmed = value.trim();

  if (/^\d+\s+\d+\/\d+$/.test(trimmed)) {
    const [whole, fraction] = trimmed.split(/\s+/);
    const fractionValue = parseFraction(fraction);
    if (fractionValue === null) return null;
    return Number(whole) + fractionValue;
  }

  if (/^\d+\/\d+$/.test(trimmed)) {
    return parseFraction(trimmed);
  }

  if (/^\d*\.?\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return null;
}

function toTitleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function inferAisle(name) {
  const normalized = String(name || '').toLowerCase();

  for (const rule of AISLE_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.aisle;
    }
  }

  return 'Other';
}

function getUnitFamily(unit) {
  if (!unit) return null;
  return UNIT_FAMILIES[unit] || null;
}

function toBaseUnitQuantity(quantity, unit) {
  const factor = UNIT_TO_BASE[unit];
  if (!factor) return null;
  return quantity * factor;
}

function fromBaseUnitQuantity(quantity, unit) {
  const factor = UNIT_TO_BASE[unit];
  if (!factor) return null;
  return quantity / factor;
}

function pickDisplayUnitForFamily(family, baseQuantity) {
  if (family === 'weight') {
    return baseQuantity >= 1000 ? 'kg' : 'g';
  }

  if (family === 'volume') {
    if (baseQuantity >= 1000) return 'l';
    if (baseQuantity >= 236.588) return 'cup';
    if (baseQuantity >= 14.7868) return 'tbsp';
    return 'tsp';
  }

  return null;
}

export function parseIngredientLine(line) {
  const original = String(line || '').trim();
  if (!original) {
    return null;
  }

  const cleaned = original
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return null;
  }

  let quantity = null;
  let remaining = cleaned;

  const quantityMatch = cleaned.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s+(.+)$/);
  if (quantityMatch) {
    quantity = parseQuantity(quantityMatch[1]);
    remaining = quantityMatch[2];
  } else if (cleaned.startsWith('a ')) {
    quantity = 1;
    remaining = cleaned.slice(2);
  } else if (cleaned.startsWith('an ')) {
    quantity = 1;
    remaining = cleaned.slice(3);
  }

  const tokens = remaining.split(' ').filter(Boolean);
  let unit = null;

  if (tokens.length > 1) {
    const candidateUnit = tokens[0].replace(/[^a-z]/g, '');
    if (UNIT_ALIASES[candidateUnit]) {
      unit = UNIT_ALIASES[candidateUnit];
      remaining = tokens.slice(1).join(' ');
    }
  }

  const ingredientName = remaining.replace(/^of\s+/, '').trim();
  if (!ingredientName) {
    return null;
  }

  return {
    original,
    quantity,
    unit,
    normalizedName: ingredientName,
    displayName: toTitleCase(ingredientName)
  };
}

function roundQuantity(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizePositiveNumber(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function getScaleMultiplier(entry) {
  const recipeServings = normalizePositiveNumber(entry?.recipe?.recipeServings, 1);
  const plannedServings = normalizePositiveNumber(
    entry?.plannedServings ?? entry?.servings,
    recipeServings
  );

  return plannedServings / recipeServings;
}

function addToTotalsMap(map, parsed, multiplier, source) {
  const family = getUnitFamily(parsed.unit);
  const key = family
    ? `${parsed.normalizedName}::family:${family}`
    : `${parsed.normalizedName}::${parsed.unit || 'unitless'}`;

  if (!map.has(key)) {
    map.set(key, {
      key,
      name: parsed.displayName,
      normalizedName: parsed.normalizedName,
      unit: parsed.unit,
      unitFamily: family,
      baseQuantity: 0,
      quantity: 0,
      occurrences: 0,
      aisle: inferAisle(parsed.normalizedName),
      sources: new Set()
    });
  }

  const entry = map.get(key);
  const scaledQuantity = (parsed.quantity || 0) * multiplier;
  if (family) {
    entry.baseQuantity += toBaseUnitQuantity(scaledQuantity, parsed.unit) || 0;
  } else {
    entry.quantity += scaledQuantity;
  }
  entry.occurrences += multiplier;
  entry.sources.add(source);
}

function addToUnparsedMap(map, parsed, multiplier, source) {
  const key = parsed.normalizedName;

  if (!map.has(key)) {
    map.set(key, {
      key,
      name: parsed.displayName,
      normalizedName: parsed.normalizedName,
      occurrences: 0,
      aisle: inferAisle(parsed.normalizedName),
      sources: new Set()
    });
  }

  const entry = map.get(key);
  entry.occurrences += multiplier;
  entry.sources.add(source);
}

export function buildShoppingList(mealPlans, options = {}) {
  const includeMeals = options.includeMeals !== false;
  const includeCookingSessions = options.includeCookingSessions !== false;

  const totalsMap = new Map();
  const unparsedMap = new Map();

  let plannedMeals = 0;
  let cookingSessions = 0;
  let recipesConsidered = 0;
  let totalIngredientLines = 0;
  let totalPlannedServings = 0;

  const processIngredients = (ingredients, multiplier, source) => {
    if (!Array.isArray(ingredients) || multiplier <= 0) {
      return;
    }

    for (const line of ingredients) {
      const parsed = parseIngredientLine(line);
      if (!parsed) continue;

      totalIngredientLines += 1;

      if (parsed.quantity !== null) {
        addToTotalsMap(totalsMap, parsed, multiplier, source);
      } else {
        addToUnparsedMap(unparsedMap, parsed, multiplier, source);
      }
    }
  };

  for (const plan of mealPlans || []) {
    if (includeMeals) {
      for (const meal of plan.meals || []) {
        if (meal.excludeFromShopping === true) continue;
        plannedMeals += 1;
        recipesConsidered += 1;
        const multiplier = getScaleMultiplier(meal);
        totalPlannedServings += normalizePositiveNumber(meal.plannedServings, meal.recipe?.recipeServings || 1);
        processIngredients(
          meal.recipe?.ingredients || [],
          multiplier,
          `${plan.date} • ${meal.recipe?.title || 'Meal'} (${multiplier.toFixed(2)}x)`
        );
      }
    }

    if (includeCookingSessions) {
      for (const session of plan.cookingSessions || []) {
        if (session.excludeFromShopping === true) continue;
        cookingSessions += 1;
        recipesConsidered += 1;
        const multiplier = getScaleMultiplier(session);
        totalPlannedServings += normalizePositiveNumber(
          session.plannedServings ?? session.servings,
          session.recipe?.recipeServings || 1
        );
        processIngredients(
          session.recipe?.ingredients || [],
          multiplier,
          `${plan.date} • ${session.recipe?.title || 'Cooking Session'} (${multiplier.toFixed(2)}x)`
        );
      }
    }
  }

  const totals = Array.from(totalsMap.values())
    .map((entry) => {
      let finalQuantity = entry.quantity;
      let finalUnit = entry.unit;

      if (entry.unitFamily) {
        finalUnit = pickDisplayUnitForFamily(entry.unitFamily, entry.baseQuantity);
        finalQuantity = fromBaseUnitQuantity(entry.baseQuantity, finalUnit) || 0;
      }

      return {
        key: `${entry.normalizedName}::${finalUnit || 'unitless'}`,
        name: entry.name,
        normalizedName: entry.normalizedName,
        unit: finalUnit,
        quantity: roundQuantity(finalQuantity),
        occurrences: entry.occurrences,
        aisle: entry.aisle,
        sources: Array.from(entry.sources).slice(0, 5)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const needsReview = Array.from(unparsedMap.values())
    .map((entry) => ({
      ...entry,
      key: entry.key,
      sources: Array.from(entry.sources).slice(0, 5)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    totals,
    needsReview,
    stats: {
      plannedMeals,
      cookingSessions,
      recipesConsidered,
      totalIngredientLines,
      totalPlannedServings: roundQuantity(totalPlannedServings),
      totalAggregatedItems: totals.length
    }
  };
}
