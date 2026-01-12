'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
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

interface Collection {
  _id: string;
  name: string;
  description: string;
  color: string;
  isDefault: boolean;
  recipeCount: number;
  recipes: Array<{ _id: string }>;
  createdAt: string;
  updatedAt: string;
}

type CategoryFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface AddRecipesClientProps {
  collectionId: string;
}

export default function AddRecipesClient({ collectionId }: AddRecipesClientProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingRecipes, setAddingRecipes] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      const data = await response.json();

      if (data.success) {
        setCollection(data.data);
      } else {
        setError(data.message || 'Failed to fetch collection');
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
      setError('Failed to load collection');
    }
  }, [collectionId]);

  const fetchAvailableRecipes = useCallback(async () => {
    try {
      const response = await fetch('/api/recipes');
      const data = await response.json();

      if (data.success) {
        setAvailableRecipes(data.data);
      } else {
        setError(data.message || 'Failed to fetch recipes');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchCollection(), fetchAvailableRecipes()]);
  }, [fetchCollection, fetchAvailableRecipes]);

  useEffect(() => {
    // Filter recipes by category
    if (categoryFilter === 'all') {
      setFilteredRecipes(availableRecipes);
    } else {
      setFilteredRecipes(availableRecipes.filter(recipe => recipe.category === categoryFilter));
    }
  }, [availableRecipes, categoryFilter]);

  const handleAddRecipe = async (recipe: Recipe) => {
    setAddingRecipes(prev => new Set(prev).add(recipe._id));
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId: recipe._id }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local collection state
        setCollection(data.data);
        setSuccessMessage(`"${recipe.title}" added to collection!`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to add recipe');
      }
    } catch (error) {
      console.error('Error adding recipe:', error);
      setError('Failed to add recipe. Please try again.');
    } finally {
      setAddingRecipes(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipe._id);
        return newSet;
      });
    }
  };

  const isRecipeInCollection = (recipeId: string) => {
    return collection?.recipes.some(r => r._id === recipeId) || false;
  };

  const getCategoryButtonClass = (category: CategoryFilter) => {
    const baseClass = "px-4 py-2 text-sm font-medium rounded-full transition-colors";
    const activeClass = "text-green-400 bg-green-900 hover:bg-green-800";
    const inactiveClass = "text-gray-300 bg-gray-700 hover:bg-gray-600";

    return `${baseClass} ${categoryFilter === category ? activeClass : inactiveClass}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📂</div>
          <p className="text-lg">Loading recipes...</p>
        </div>
      </div>
    );
  }

  if (error && !collection) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-gray-300 mb-4">Error loading data</p>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/collections"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: collection?.color }}
          />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Add Recipes to &quot;{collection?.name}&quot;
          </h2>
        </div>
        <p className="text-lg sm:text-xl text-gray-300">
          Choose recipes to add to your collection. Recipes already in the collection are disabled.
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-900 border border-green-600 text-green-300 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-900 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 mb-8">
        <button
          onClick={() => setCategoryFilter('all')}
          className={getCategoryButtonClass('all')}
        >
          <span className="hidden sm:inline">All Categories</span>
          <span className="sm:hidden">All</span>
        </button>
        <button
          onClick={() => setCategoryFilter('breakfast')}
          className={getCategoryButtonClass('breakfast')}
        >
          Breakfast
        </button>
        <button
          onClick={() => setCategoryFilter('lunch')}
          className={getCategoryButtonClass('lunch')}
        >
          Lunch
        </button>
        <button
          onClick={() => setCategoryFilter('dinner')}
          className={getCategoryButtonClass('dinner')}
        >
          Dinner
        </button>
        <button
          onClick={() => setCategoryFilter('snack')}
          className={getCategoryButtonClass('snack')}
        >
          Snack
        </button>
      </div>

      {/* Available Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl text-gray-300 mb-4">
              {categoryFilter === 'all' ? 'No recipes available' : `No ${categoryFilter} recipes found`}
            </p>
            <p className="text-gray-400 mb-6">
              {categoryFilter === 'all'
                ? 'Create some recipes first to add them to your collections.'
                : 'Try selecting a different category or create some recipes first.'
              }
            </p>
            <Link
              href="/recipes/add"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Add New Recipe
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {filteredRecipes.map((recipe) => {
            const inCollection = isRecipeInCollection(recipe._id);
            const isAdding = addingRecipes.has(recipe._id);

            return (
              <div
                key={recipe._id}
                className={`bg-gray-800 rounded-xl shadow-sm border transition-all ${
                  inCollection
                    ? 'border-green-500 opacity-60'
                    : 'border-gray-700 hover:shadow-md'
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1.5 sm:gap-0">
                      <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full capitalize ${
                        recipe.category === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
                        recipe.category === 'lunch' ? 'bg-blue-900 text-blue-300' :
                        recipe.category === 'dinner' ? 'bg-purple-900 text-purple-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {recipe.category}
                      </span>
                      <span className={`px-1.5 sm:px-2 py-1 text-xs font-medium rounded-full ${
                        recipe.isGlobal
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-green-900 text-green-300'
                      }`}>
                        {recipe.isGlobal ? 'Global' : 'Your Recipe'}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">{recipe.prepTime} min</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{recipe.title}</h4>
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="grid grid-cols-2 sm:flex sm:justify-between items-center text-xs text-gray-400 mb-3 sm:mb-4 gap-2 sm:gap-0">
                    <span>{recipe.macros.calories} cal</span>
                    <span>{recipe.macros.protein}g protein</span>
                    <span>{recipe.macros.carbs}g carbs</span>
                    <span>{recipe.macros.fat}g fat</span>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/recipe/${recipe._id}`}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors font-medium text-center text-sm"
                    >
                      View
                    </Link>

                    <button
                      onClick={() => handleAddRecipe(recipe)}
                      disabled={inCollection || isAdding}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                        inCollection
                          ? 'bg-green-800 text-green-300 cursor-not-allowed'
                          : isAdding
                          ? 'bg-purple-700 text-white cursor-wait'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {inCollection ? 'In Collection' : isAdding ? 'Adding...' : 'Add to Collection'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}