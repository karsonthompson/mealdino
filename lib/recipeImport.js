function cleanLines(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

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

  if (file.endsWith('.pdf') || mime.includes('pdf')) {
    return {
      drafts: [],
      warnings: ['PDF extraction is not enabled in this version yet. Paste text from the PDF or upload .txt/.md/.json.']
    };
  }

  if (file.endsWith('.json') || mime.includes('json')) {
    try {
      const drafts = parseJsonDrafts(text);
      return {
        drafts,
        warnings: drafts.length === 0 ? ['JSON parsed but no valid recipes were found.'] : []
      };
    } catch (error) {
      return { drafts: [], warnings: ['Invalid JSON file.'] };
    }
  }

  const drafts = parseRecipeDocumentText(text);

  return {
    drafts,
    warnings: drafts.length === 0 ? ['No recipes could be parsed. Try clearer headings and sections (Ingredients / Instructions).'] : []
  };
}
