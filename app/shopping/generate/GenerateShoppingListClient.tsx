'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RecipeSummary {
  _id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  recipeServings: number;
  isGlobal: boolean;
}

interface GenerateShoppingListClientProps {
  recipes: RecipeSummary[];
}

export default function GenerateShoppingListClient({ recipes }: GenerateShoppingListClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const filteredRecipes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return recipes;
    return recipes.filter((recipe) => (
      recipe.title.toLowerCase().includes(normalized)
      || recipe.category.toLowerCase().includes(normalized)
    ));
  }, [recipes, query]);

  const selectedCount = Object.keys(selected).length;

  const toggleRecipe = (recipe: RecipeSummary) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[recipe._id]) {
        delete next[recipe._id];
      } else {
        next[recipe._id] = recipe.recipeServings || 1;
      }
      return next;
    });
  };

  const updatePlannedServings = (recipeId: string, rawValue: string) => {
    const value = Number(rawValue);
    setSelected((prev) => {
      if (!prev[recipeId]) return prev;
      return {
        ...prev,
        [recipeId]: Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 1
      };
    });
  };

  const generateList = () => {
    if (selectedCount === 0) return;
    setSubmitting(true);

    const selectedRecipes = Object.entries(selected).map(([recipeId, plannedServings]) => ({
      recipeId,
      plannedServings
    }));

    const params = new URLSearchParams();
    params.set('source', 'recipes');
    params.set('selectedRecipes', JSON.stringify(selectedRecipes));
    router.push(`/shopping?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Select recipes to shop for</h3>
            <p className="text-sm text-gray-400">Choose recipes and adjust planned servings before generating your list.</p>
          </div>
          <div className="text-sm text-gray-300">
            Selected: <span className="text-green-300 font-semibold">{selectedCount}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes by name or category..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          />
          <button
            type="button"
            onClick={() => setSelected({})}
            disabled={selectedCount === 0}
            className="px-3 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50"
          >
            Clear selection
          </button>
        </div>
      </section>

      <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
        {filteredRecipes.length === 0 ? (
          <p className="text-sm text-gray-400">No recipes match your search.</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredRecipes.map((recipe) => {
              const isSelected = Boolean(selected[recipe._id]);
              return (
                <label
                  key={recipe._id}
                  className={`block rounded-lg border p-3 cursor-pointer transition-colors ${isSelected ? 'bg-green-900/20 border-green-600' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        className="mt-1 accent-green-500"
                        checked={isSelected}
                        onChange={() => toggleRecipe(recipe)}
                      />
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{recipe.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {recipe.category} • {recipe.prepTime} min • Base {recipe.recipeServings} servings • {recipe.isGlobal ? 'Global' : 'Your recipe'}
                        </p>
                      </div>
                    </div>

                    <div className="sm:w-44">
                      <label className="block text-xs text-gray-400 mb-1">Planned servings</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        disabled={!isSelected}
                        value={isSelected ? selected[recipe._id] : recipe.recipeServings}
                        onChange={(e) => updatePlannedServings(recipe._id, e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white disabled:opacity-50"
                      />
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        <Link
          href="/shopping"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
          Back to Shopping
        </Link>
        <button
          type="button"
          onClick={generateList}
          disabled={selectedCount === 0 || submitting}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
        >
          {submitting ? 'Generating...' : 'Generate Shopping List'}
        </button>
      </section>
    </div>
  );
}
