'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DraftRecipe {
  id: string;
  selected: boolean;
  title: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  recipeServings: number;
  ingredients: string[];
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl: string;
}

interface ParseResponse {
  success: boolean;
  message?: string;
  data?: {
    drafts: Omit<DraftRecipe, 'id' | 'selected'>[];
    warnings: string[];
    count: number;
  };
}

interface ImportResponse {
  success: boolean;
  message?: string;
  data?: {
    createdCount: number;
    errorCount: number;
    errors: { index: number; message: string }[];
  };
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function toLines(text: string) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

export default function ImportRecipesClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftRecipe[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const selectedCount = useMemo(() => drafts.filter((draft) => draft.selected).length, [drafts]);

  const handleParse = async () => {
    if (!file && !pastedText.trim()) {
      setStatus('Upload a file or paste recipe text first.');
      return;
    }

    if (file && file.size > MAX_UPLOAD_BYTES) {
      setStatus('This hosted parser accepts files up to about 4MB. Split the PDF into smaller files or paste text directly.');
      return;
    }

    setParsing(true);
    setStatus(null);

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (pastedText.trim()) formData.append('text', pastedText);

      const response = await fetch('/api/recipes/import/parse', {
        method: 'POST',
        body: formData
      });
      const result = (await response.json()) as ParseResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Failed to parse recipes');
      }

      const nextDrafts = result.data.drafts.map((draft, index) => ({
        ...draft,
        id: `${Date.now()}-${index}`,
        selected: true
      }));

      setWarnings(result.data.warnings || []);
      setDrafts(nextDrafts);
      setStatus(`Parsed ${nextDrafts.length} recipe draft(s). Review before importing.`);
    } catch (error) {
      console.error('Parse failed:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to parse recipes');
    } finally {
      setParsing(false);
    }
  };

  const updateDraft = (id: string, updater: (draft: DraftRecipe) => DraftRecipe) => {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? updater(draft) : draft)));
  };

  const handleImport = async () => {
    const selectedDrafts = drafts.filter((draft) => draft.selected);
    if (selectedDrafts.length === 0) {
      setStatus('Select at least one draft to import.');
      return;
    }

    setImporting(true);
    setStatus(null);

    try {
      const response = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          drafts: selectedDrafts.map((draft) => ({
            ...draft,
            ingredients: draft.ingredients,
            instructions: draft.instructions
          }))
        })
      });

      const result = (await response.json()) as ImportResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Failed to import recipes');
      }

      setStatus(`Imported ${result.data.createdCount} recipe(s).`);
      if (result.data.errorCount === 0) {
        setTimeout(() => router.push('/recipes'), 900);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to import recipes');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
        <p className="text-sm text-gray-200 mb-3">Upload a recipe document or paste raw text. Supported: `.txt`, `.md`, `.json`, `.pdf`.</p>
        <p className="text-xs text-gray-400 mb-3">For Vercel-hosted uploads, keep files under about 4MB.</p>

        <div className="space-y-3">
          <input
            type="file"
            accept=".txt,.md,.json,.csv,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-200 file:mr-3 file:px-3 file:py-2 file:rounded file:border-0 file:bg-gray-600 file:text-white"
          />

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            placeholder="Or paste recipe text here..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleParse}
              disabled={parsing}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm"
            >
              {parsing ? 'Parsing...' : 'Parse Recipes'}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm"
            >
              {importing ? 'Importing...' : `Import Selected (${selectedCount})`}
            </button>
          </div>
        </div>

        {status && <p className="text-sm text-green-300 mt-3">{status}</p>}
        {warnings.length > 0 && (
          <div className="mt-3 text-sm text-yellow-300 space-y-1">
            {warnings.map((warning) => (
              <p key={warning}>• {warning}</p>
            ))}
          </div>
        )}
      </div>

      {drafts.length > 0 && (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.selected}
                  onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, selected: e.target.checked }))}
                  className="accent-green-500"
                />
                <span className="text-sm text-gray-300">Include in import</span>
              </div>

              <input
                value={draft.title}
                onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, title: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Title"
              />

              <textarea
                value={draft.description}
                onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, description: e.target.value }))}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Description"
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select
                  value={draft.category}
                  onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, category: e.target.value as DraftRecipe['category'] }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-sm"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={draft.prepTime}
                  onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, prepTime: Number(e.target.value) || 1 }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-sm"
                  placeholder="Prep"
                />
                <input
                  type="number"
                  min="1"
                  value={draft.recipeServings}
                  onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, recipeServings: Number(e.target.value) || 1 }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-sm"
                  placeholder="Servings"
                />
                <input
                  type="number"
                  min="0"
                  value={draft.macros.calories}
                  onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, macros: { ...current.macros, calories: Number(e.target.value) || 0 } }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-sm"
                  placeholder="Calories"
                />
              </div>

              <textarea
                value={draft.ingredients.join('\n')}
                onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, ingredients: toLines(e.target.value) }))}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Ingredients (one per line)"
              />

              <textarea
                value={draft.instructions.join('\n')}
                onChange={(e) => updateDraft(draft.id, (current) => ({ ...current, instructions: toLines(e.target.value) }))}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Instructions (one per line)"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
