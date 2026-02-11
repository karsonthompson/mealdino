function cleanLines(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const ALLOWED_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/400x300?text=Recipe+Image';
const MAX_LLM_SOURCE_CHARS = 120000;

function inferCategory(text) {
  const value = String(text || '').toLowerCase();
  if (/breakfast|pancake|oat|omelet|omelette|toast/.test(value)) return 'breakfast';
  if (/snack|bar|smoothie|bites/.test(value)) return 'snack';
  if (/dinner|steak|salmon|pasta|casserole/.test(value)) return 'dinner';
  return 'lunch';
}

function parseNumberFromPattern(text, pattern, fallback) {
  const match = String(text || '').match(pattern);
  if (!match) return fallback;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function splitRecipeBlocks(text) {
  const normalized = String(text || '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');

  const headingIndexes = [];
  lines.forEach((line, index) => {
    if (/^(#{1,3}\s+.+|title\s*:|recipe\s*:|name\s*:)/i.test(line.trim())) {
      headingIndexes.push(index);
    }
  });

  if (headingIndexes.length <= 1) {
    return normalized.split(/\n\s*\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
  }

  const blocks = [];
  for (let i = 0; i < headingIndexes.length; i += 1) {
    const start = headingIndexes[i];
    const end = i + 1 < headingIndexes.length ? headingIndexes[i + 1] : lines.length;
    const block = lines.slice(start, end).join('\n').trim();
    if (block) blocks.push(block);
  }

  return blocks;
}

function parseIngredients(lines) {
  return lines
    .map((line) => line.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}

function parseInstructions(lines) {
  return lines
    .map((line) => line.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}

function parseTextBlockToDraft(block, index = 0) {
  const lines = cleanLines(block);
  if (lines.length === 0) return null;

  const titleLine = lines[0]
    .replace(/^#{1,3}\s*/, '')
    .replace(/^(title|recipe|name)\s*:\s*/i, '')
    .trim();

  let title = titleLine || `Imported Recipe ${index + 1}`;
  if (title.length > 100) {
    title = title.slice(0, 100).trim();
  }

  const fullText = lines.join('\n');
  const prepTime = parseNumberFromPattern(fullText, /(\d+)\s*(?:min|mins|minute|minutes)\b/i, 30);
  const recipeServings = parseNumberFromPattern(fullText, /(?:serves?|yield)\s*[:\-]?\s*(\d+)/i, 1);

  const ingredientsHeaderIndex = lines.findIndex((line) => /^ingredients?\s*:?$/i.test(line));
  const instructionsHeaderIndex = lines.findIndex((line) => /^(instructions?|directions?|steps?)\s*:?$/i.test(line));

  let description = '';
  let ingredients = [];
  let instructions = [];

  if (ingredientsHeaderIndex !== -1) {
    const descriptionLines = lines.slice(1, ingredientsHeaderIndex);
    description = descriptionLines.join(' ').trim();

    const ingredientsEnd = instructionsHeaderIndex !== -1 && instructionsHeaderIndex > ingredientsHeaderIndex
      ? instructionsHeaderIndex
      : lines.length;

    ingredients = parseIngredients(lines.slice(ingredientsHeaderIndex + 1, ingredientsEnd));
  }

  if (instructionsHeaderIndex !== -1) {
    instructions = parseInstructions(lines.slice(instructionsHeaderIndex + 1));
  }

  if (!description) {
    description = lines.slice(1, Math.min(lines.length, 4)).join(' ').trim();
  }

  if (!description) {
    description = `Imported recipe for ${title}`;
  }

  if (ingredients.length === 0) {
    ingredients = ['(Needs review) Add ingredients'];
  }

  if (instructions.length === 0) {
    instructions = ['Review this imported recipe and add instructions.'];
  }

  return {
    title,
    description,
    category: inferCategory(`${title} ${description}`),
    prepTime,
    recipeServings,
    ingredients,
    instructions,
    macros: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    imageUrl: 'https://via.placeholder.com/400x300?text=Recipe+Image'
  };
}

function parseJsonDrafts(text) {
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : [parsed];

  return list
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;

      const title = String(item.title || item.name || `Imported Recipe ${index + 1}`).trim();
      if (!title) return null;

      const ingredients = Array.isArray(item.ingredients)
        ? item.ingredients.map((v) => String(v).trim()).filter(Boolean)
        : [];
      const instructions = Array.isArray(item.instructions)
        ? item.instructions.map((v) => String(v).trim()).filter(Boolean)
        : [];

      return {
        title: title.slice(0, 100),
        description: String(item.description || `Imported recipe for ${title}`).slice(0, 500),
        category: ['breakfast', 'lunch', 'dinner', 'snack'].includes(item.category) ? item.category : inferCategory(title),
        prepTime: Number(item.prepTime) > 0 ? Number(item.prepTime) : 30,
        recipeServings: Number(item.recipeServings) > 0 ? Number(item.recipeServings) : 1,
        ingredients: ingredients.length > 0 ? ingredients : ['(Needs review) Add ingredients'],
        instructions: instructions.length > 0 ? instructions : ['Review this imported recipe and add instructions.'],
        macros: {
          calories: Number(item?.macros?.calories) || 0,
          protein: Number(item?.macros?.protein) || 0,
          carbs: Number(item?.macros?.carbs) || 0,
          fat: Number(item?.macros?.fat) || 0
        },
        imageUrl: String(item.imageUrl || 'https://via.placeholder.com/400x300?text=Recipe+Image')
      };
    })
    .filter(Boolean);
}

function sanitizeDraftShape(draft, index = 0) {
  const title = String(draft?.title || draft?.name || `Imported Recipe ${index + 1}`).trim().slice(0, 100);
  if (!title) return null;

  const description = String(draft?.description || `Imported recipe for ${title}`).trim().slice(0, 500);
  const ingredients = Array.isArray(draft?.ingredients)
    ? draft.ingredients.map((v) => String(v || '').trim()).filter(Boolean)
    : [];
  const instructions = Array.isArray(draft?.instructions)
    ? draft.instructions.map((v) => String(v || '').trim()).filter(Boolean)
    : [];

  return {
    title,
    description: description || `Imported recipe for ${title}`,
    category: ALLOWED_CATEGORIES.includes(draft?.category) ? draft.category : inferCategory(`${title} ${description}`),
    prepTime: Number(draft?.prepTime) > 0 ? Number(draft.prepTime) : 30,
    recipeServings: Number(draft?.recipeServings) > 0 ? Number(draft.recipeServings) : 1,
    ingredients: ingredients.length > 0 ? ingredients : ['(Needs review) Add ingredients'],
    instructions: instructions.length > 0 ? instructions : ['Review this imported recipe and add instructions.'],
    macros: {
      calories: Number(draft?.macros?.calories) || 0,
      protein: Number(draft?.macros?.protein) || 0,
      carbs: Number(draft?.macros?.carbs) || 0,
      fat: Number(draft?.macros?.fat) || 0
    },
    imageUrl: String(draft?.imageUrl || DEFAULT_IMAGE_URL)
  };
}

function dedupeDraftsByTitle(drafts) {
  const byTitle = new Map();
  for (let index = 0; index < drafts.length; index += 1) {
    const sanitized = sanitizeDraftShape(drafts[index], index);
    if (!sanitized) continue;
    const key = sanitized.title.toLowerCase();
    if (!byTitle.has(key)) byTitle.set(key, sanitized);
  }
  return Array.from(byTitle.values());
}

function needsLLMRescue(drafts) {
  if (!Array.isArray(drafts) || drafts.length === 0) return true;
  const placeholderCount = drafts.filter((draft) => (
    (draft.ingredients || []).some((line) => String(line).toLowerCase().includes('needs review'))
    || (draft.instructions || []).some((line) => String(line).toLowerCase().includes('review this imported recipe'))
  )).length;
  return placeholderCount >= Math.ceil(drafts.length * 0.5);
}

function parseJsonObjectFromText(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

async function parseWithLLM({ text, fileName, mimeType }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { drafts: [], warnings: ['LLM enhancement unavailable (OPENAI_API_KEY missing).'] };
  }

  const sourceText = String(text || '').slice(0, MAX_LLM_SOURCE_CHARS);
  if (!sourceText.trim()) {
    return { drafts: [], warnings: [] };
  }

  const model = process.env.OPENAI_IMPORT_MODEL || process.env.OPENAI_AGENT_MODEL || 'gpt-4o-mini';
  const systemPrompt = [
    'Extract recipes from messy source text and return strict JSON only.',
    'If multiple recipes exist, return all of them.',
    'Schema:',
    '{"recipes":[{"title":"string","description":"string","category":"breakfast|lunch|dinner|snack","prepTime":number,"recipeServings":number,"ingredients":[string],"instructions":[string],"macros":{"calories":number,"protein":number,"carbs":number,"fat":number}}],"warnings":[string]}',
    'Do not include markdown.'
  ].join(' ');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_completion_tokens: 2200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              `File name: ${String(fileName || 'unknown')}`,
              `Mime type: ${String(mimeType || 'unknown')}`,
              'Extract recipe drafts from this content:',
              sourceText
            ].join('\n\n')
          }
        ]
      })
    });

    if (!response.ok) {
      return { drafts: [], warnings: ['LLM enhancement request failed; using deterministic parse.'] };
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || '';
    const parsed = parseJsonObjectFromText(content);
    const recipes = Array.isArray(parsed?.recipes) ? parsed.recipes : [];
    const warnings = Array.isArray(parsed?.warnings) ? parsed.warnings.map((w) => String(w)) : [];

    return {
      drafts: recipes.map((recipe, index) => sanitizeDraftShape(recipe, index)).filter(Boolean),
      warnings
    };
  } catch (error) {
    console.error('LLM recipe import enhancement failed:', error);
    return { drafts: [], warnings: ['LLM enhancement failed; using deterministic parse.'] };
  }
}

export function parseRecipeDocumentText(text) {
  const blocks = splitRecipeBlocks(text);

  return blocks
    .map((block, index) => parseTextBlockToDraft(block, index))
    .filter(Boolean)
    .slice(0, 100);
}

export function parseRecipeImportInput({ text, fileName, mimeType }) {
  const file = String(fileName || '').toLowerCase();
  const mime = String(mimeType || '').toLowerCase();

  if (!text || !text.trim()) {
    return { drafts: [], warnings: ['No readable text found in the uploaded content.'] };
  }

  if (file.endsWith('.json') || mime.includes('json')) {
    try {
      const drafts = parseJsonDrafts(text);
      return {
        drafts,
        warnings: drafts.length === 0 ? ['JSON parsed but no valid recipes were found.'] : []
      };
    } catch (error) {
      const drafts = parseRecipeDocumentText(text);
      return {
        drafts,
        warnings: drafts.length === 0
          ? ['Invalid JSON file and no recipes could be parsed as text.']
          : ['Invalid JSON file. Parsed as plain text instead.']
      };
    }
  }

  const drafts = parseRecipeDocumentText(text);

  return {
    drafts,
    warnings: drafts.length === 0 ? ['No recipes could be parsed. Try clearer headings and sections (Ingredients / Instructions).'] : []
  };
}

export async function parseRecipeImportInputSmart({ text, fileName, mimeType }) {
  const deterministic = parseRecipeImportInput({ text, fileName, mimeType });
  const deterministicDrafts = Array.isArray(deterministic?.drafts) ? deterministic.drafts : [];
  const deterministicWarnings = Array.isArray(deterministic?.warnings) ? deterministic.warnings : [];

  const llmResult = await parseWithLLM({ text, fileName, mimeType });
  const llmDrafts = Array.isArray(llmResult?.drafts) ? llmResult.drafts : [];
  const llmWarnings = Array.isArray(llmResult?.warnings) ? llmResult.warnings : [];

  const mergedDrafts = dedupeDraftsByTitle(
    needsLLMRescue(deterministicDrafts)
      ? [...deterministicDrafts, ...llmDrafts]
      : [...deterministicDrafts, ...llmDrafts.slice(0, 10)]
  ).slice(0, 100);

  const warnings = [
    ...deterministicWarnings,
    ...(llmDrafts.length > 0 ? ['Applied AI cleanup to improve parsing quality.'] : []),
    ...llmWarnings
  ];

  return {
    drafts: mergedDrafts,
    warnings
  };
}
