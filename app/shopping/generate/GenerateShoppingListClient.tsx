'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

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

interface CollectionSummary {
  _id: string;
  name: string;
  recipeCount: number;
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function GenerateShoppingListClient({ recipes }: GenerateShoppingListClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'recipes' | 'collection'>('recipes');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [startDate, setStartDate] = useState(formatDateForInput(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 13);
    return formatDateForInput(end);
  });
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

  useEffect(() => {
    if (mode !== 'collection') return;
    if (loadingCollections || collections.length > 0) return;

    const loadCollections = async () => {
      setLoadingCollections(true);
      try {
        const response = await fetch('/api/collections');
        const data = await response.json();
        if (!response.ok || !data?.success || !Array.isArray(data?.data)) {
          throw new Error(data?.message || 'Failed to load collections');
        }

        const nextCollections = data.data
          .map((collection: any) => ({
            _id: String(collection._id),
            name: String(collection.name || ''),
            recipeCount: Number(collection.recipeCount || 0)
          }))
          .filter((collection: CollectionSummary) => collection.recipeCount > 0)
          .sort((a: CollectionSummary, b: CollectionSummary) => a.name.localeCompare(b.name));

        setCollections(nextCollections);
        if (!selectedCollectionId && nextCollections.length > 0) {
          setSelectedCollectionId(nextCollections[0]._id);
        }
      } catch (error) {
        console.error('Failed to load collections:', error);
      } finally {
        setLoadingCollections(false);
      }
    };

    loadCollections();
  }, [collections.length, loadingCollections, mode, selectedCollectionId]);

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
    if (mode === 'recipes' && selectedCount === 0) return;
    if (mode === 'collection' && (!selectedCollectionId || !startDate || !endDate || startDate > endDate)) return;

    setSubmitting(true);

    const params = new URLSearchParams();
    if (mode === 'recipes') {
      const selectedRecipes = Object.entries(selected).map(([recipeId, plannedServings]) => ({
        recipeId,
        plannedServings
      }));
      params.set('source', 'recipes');
      params.set('selectedRecipes', JSON.stringify(selectedRecipes));
    } else {
      params.set('source', 'collection');
      params.set('collectionId', selectedCollectionId);
      params.set('start', startDate);
      params.set('end', endDate);
    }
    router.push(`/shopping?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Generate Shopping List</h3>
            <p className="text-sm text-gray-400">Build from selected recipes or from a collection over a date range.</p>
          </div>
          <div className="text-sm text-gray-300">
            {mode === 'recipes' ? (
              <>Selected: <span className="text-green-300 font-semibold">{selectedCount}</span></>
            ) : (
              <span>Collection mode</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm text-gray-300">
            Source Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'recipes' | 'collection')}
              className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="recipes">Selected recipes</option>
              <option value="collection">Collection + date range</option>
            </select>
          </label>

          {mode === 'recipes' ? (
            <>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
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
            </>
          ) : (
            <>
              <label className="text-sm text-gray-300">
                Collection
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  disabled={loadingCollections}
                >
                  {collections.length === 0 ? (
                    <option value="">
                      {loadingCollections ? 'Loading collections...' : 'No collections with recipes'}
                    </option>
                  ) : (
                    collections.map((collection) => (
                      <option key={collection._id} value={collection._id}>
                        {collection.name} ({collection.recipeCount})
                      </option>
                    ))
                  )}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-gray-300">
                  Start
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </label>
                <label className="text-sm text-gray-300">
                  End
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </section>

      {mode === 'recipes' && (
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
      )}

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
          disabled={
            submitting
            || (mode === 'recipes' && selectedCount === 0)
            || (mode === 'collection' && (!selectedCollectionId || !startDate || !endDate || startDate > endDate))
          }
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
        >
          {submitting ? 'Generating...' : 'Generate Shopping List'}
        </button>
      </section>
    </div>
  );
}
