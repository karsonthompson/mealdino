'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HomePageClient from '../HomePageClient';
import CreateCollectionModal from '@/components/CreateCollectionModal';

interface Recipe {
  _id: string;
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
  userId: string | null;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecipesPageClientProps {
  initialRecipes: Recipe[];
  isAuthenticated: boolean;
}

interface CollectionSummary {
  _id: string;
  name: string;
  color: string;
  recipeCount: number;
}

type RecipeFilter = 'all' | 'my-recipes' | 'global';
type CategoryFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function RecipesPageClient({ initialRecipes, isAuthenticated }: RecipesPageClientProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RecipeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [recipeCounts, setRecipeCounts] = useState({
    all: initialRecipes.length,
    global: 0,
    myRecipes: 0
  });
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const collectionsMenuRef = useRef<HTMLDivElement | null>(null);

  // Calculate recipe counts
  useEffect(() => {
    const globalCount = recipes.filter(recipe => recipe.isGlobal).length;
    const myRecipesCount = recipes.filter(recipe => !recipe.isGlobal).length;

    setRecipeCounts({
      all: recipes.length,
      global: globalCount,
      myRecipes: myRecipesCount
    });
  }, [recipes]);

  useEffect(() => {
    if (!collectionsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!collectionsMenuRef.current) return;
      if (!collectionsMenuRef.current.contains(event.target as Node)) {
        setCollectionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collectionsOpen]);

  // Filter recipes by category
  const filteredRecipes = categoryFilter === 'all'
    ? recipes
    : recipes.filter(recipe => recipe.category === categoryFilter);

  // Fetch recipes based on filter
  const fetchRecipes = async (filter: RecipeFilter) => {
    setLoading(true);
    try {
      let endpoint = '/api/recipes';

      switch (filter) {
        case 'global':
          endpoint = '/api/recipes/global';
          break;
        case 'my-recipes':
          endpoint = '/api/recipes/user-only';
          break;
        case 'all':
        default:
          endpoint = '/api/recipes';
          break;
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setRecipes(data.data);
      } else {
        console.error('Failed to fetch recipes:', data.message);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = async (filter: RecipeFilter) => {
    if (filter === activeFilter) return;

    setActiveFilter(filter);
    setCategoryFilter('all'); // Reset category filter when changing recipe type
    await fetchRecipes(filter);
  };

  // Handle category filter change
  const handleCategoryFilter = (category: CategoryFilter) => {
    setCategoryFilter(category);
  };

  const fetchCollections = async () => {
    if (!isAuthenticated) return;
    setLoadingCollections(true);
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      if (data.success) {
        const nextCollections = (data.data || []).map((collection: any) => ({
          _id: collection._id,
          name: collection.name,
          color: collection.color,
          recipeCount: collection.recipeCount
        }));
        setCollections(nextCollections);
        setCollectionsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const toggleCollectionsMenu = async () => {
    const nextOpen = !collectionsOpen;
    setCollectionsOpen(nextOpen);
    if (nextOpen && !collectionsLoaded && !loadingCollections) {
      await fetchCollections();
    }
  };

  const handleCreateCollection = async (collectionData: { name: string; description: string; color: string }) => {
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collectionData),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to create collection');
    }

    await fetchCollections();
    setShowCreateCollectionModal(false);
    setCollectionsOpen(true);
  };

  const recipeFilterOptions: Array<{ value: RecipeFilter; label: string }> = [
    { value: 'all', label: `All (${recipeCounts.all})` },
    ...(isAuthenticated ? [{ value: 'my-recipes' as RecipeFilter, label: `My Recipes (${recipeCounts.myRecipes})` }] : []),
    { value: 'global', label: `Global (${recipeCounts.global})` }
  ];

  const categoryFilterOptions: Array<{ value: CategoryFilter; label: string }> = [
    { value: 'all', label: 'All Categories' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' }
  ];

  return (
    <div className="mb-12">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-white text-center lg:text-left">
          Recipes
          {loading && <span className="text-sm text-gray-400 ml-2">(Loading...)</span>}
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
            <label className="text-xs text-gray-400">
              Source
              <select
                value={activeFilter}
                onChange={(e) => handleFilterChange(e.target.value as RecipeFilter)}
                disabled={loading}
                className="mt-1 w-full min-w-[180px] bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              >
                {recipeFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-gray-400">
              Category
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilter(e.target.value as CategoryFilter)}
                className="mt-1 w-full min-w-[180px] bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              >
                {categoryFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Collections Link - only show if authenticated */}
          {isAuthenticated && (
            <div className="relative w-full sm:w-auto sm:self-end" ref={collectionsMenuRef}>
              <button
                type="button"
                onClick={toggleCollectionsMenu}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <span>📂</span>
                <span>Collections</span>
                <span className={`transition-transform ${collectionsOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>

              {collectionsOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  <div className="p-2 border-b border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateCollectionModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      + Create New Collection
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {loadingCollections ? (
                      <p className="px-3 py-3 text-sm text-gray-400">Loading collections...</p>
                    ) : collections.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-gray-400">No collections yet.</p>
                    ) : (
                      collections.map((collection) => (
                        <Link
                          key={collection._id}
                          href={`/collections/${collection._id}`}
                          onClick={() => setCollectionsOpen(false)}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: collection.color }} />
                            <span className="text-sm text-white truncate">{collection.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{collection.recipeCount}</span>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-700">
                    <Link
                      href="/collections"
                      onClick={() => setCollectionsOpen(false)}
                      className="block px-3 py-2 text-sm text-green-300 hover:bg-gray-700"
                    >
                      View all collections →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Recipe Button - only show if authenticated */}
          {isAuthenticated && (
            <div className="flex gap-2 w-full sm:w-auto sm:self-end">
              <Link
                href="/recipes/import"
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <span>⇪</span>
                <span className="hidden sm:inline">Import Recipes</span>
                <span className="sm:hidden">Import</span>
              </Link>
              <Link
                href="/recipes/add"
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <span>+</span>
                <span className="hidden sm:inline">Add Recipe</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Empty State Messages */}
      {filteredRecipes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">🍽️</div>
          {activeFilter === 'my-recipes' ? (
            <>
              <p className="text-lg text-gray-300">You haven&apos;t created any recipes yet</p>
              <p className="text-sm text-gray-400 mt-2">
                <Link href="/recipes/add" className="text-green-400 hover:text-green-300">
                  Create your first recipe
                </Link>
              </p>
            </>
          ) : activeFilter === 'global' ? (
            <>
              <p className="text-lg text-gray-300">No global recipes found</p>
              <p className="text-sm text-gray-400 mt-2">Check back later for community recipes!</p>
            </>
          ) : (
            <>
              <p className="text-lg text-gray-300">No recipes found</p>
              <p className="text-sm text-gray-400 mt-2">
                {categoryFilter !== 'all'
                  ? `Try selecting a different category or `
                  : ''
                }
                <Link href="/recipes/add" className="text-green-400 hover:text-green-300">
                  add a new recipe
                </Link>
              </p>
            </>
          )}
        </div>
      )}

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 && (
        <HomePageClient recipes={filteredRecipes} />
      )}

      <CreateCollectionModal
        isOpen={showCreateCollectionModal}
        onClose={() => setShowCreateCollectionModal(false)}
        onSubmit={handleCreateCollection}
      />
    </div>
  );
}
