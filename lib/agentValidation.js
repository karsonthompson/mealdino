function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function parseForbiddenKeywords(hardConstraints) {
  const keywords = new Set();

  for (const constraint of hardConstraints || []) {
    const text = normalizeText(constraint);
    if (!text) continue;

    const patterns = [
      /^no\s+(.+)$/,
      /^avoid\s+(.+)$/,
      /^exclude\s+(.+)$/,
      /^without\s+(.+)$/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        keywords.add(match[1].trim());
      }
    }
  }

  return Array.from(keywords);
}

function parseMaxCookTime(hardConstraints) {
  for (const constraint of hardConstraints || []) {
    const text = normalizeText(constraint);
    const match = text.match(/max(?:imum)?\s*(\d+)\s*min/);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }
  return null;
}

export function validateAgentDraft(profile, recipeCatalog) {
  const hardConstraints = Array.isArray(profile?.hardConstraints) ? profile.hardConstraints : [];
  const violations = [];

  if (!profile?.medicalDisclaimerAcceptedAt) {
    violations.push('Medical disclaimer not accepted.');
  }

  const forbiddenKeywords = parseForbiddenKeywords(hardConstraints);
  if (forbiddenKeywords.length > 0) {
    for (const recipe of recipeCatalog || []) {
      const ingredientLines = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
      const haystack = ingredientLines.map(normalizeText).join('\n');
      for (const keyword of forbiddenKeywords) {
        if (haystack.includes(normalizeText(keyword))) {
          violations.push(`Hard constraint violation: "${keyword}" found in recipe "${recipe.title}".`);
        }
      }
    }
  }

  const maxCookTime = parseMaxCookTime(hardConstraints);
  if (maxCookTime) {
    for (const recipe of recipeCatalog || []) {
      if (Number.isFinite(Number(recipe?.prepTime)) && Number(recipe.prepTime) > maxCookTime) {
        violations.push(`Hard constraint violation: "${recipe.title}" prep time ${recipe.prepTime} exceeds max ${maxCookTime} min.`);
      }
    }
  }

  return {
    hardConstraintViolations: violations,
    hardConstraintPass: violations.length === 0
  };
}
