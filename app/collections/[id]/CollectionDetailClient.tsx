'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import HomePageClient from '../../HomePageClient';

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
  recipes: Recipe[];
  createdAt: string;
  updatedAt: string;
}

interface CollectionDetailClientProps {
  collectionId: string;
}

export default function CollectionDetailClient({ collectionId }: CollectionDetailClientProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    setLoading(true);
    setError(null);

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
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleRemoveRecipe = async (recipeId: string, recipeTitle: string) => {
    if (!collection) return;

    if (!confirm(`Remove "${recipeTitle}" from this collection?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/collections/${collectionId}/recipes`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setCollection(data.data);
      } else {
        alert('Failed to remove recipe: ' + data.message);
      }
    } catch (error) {
      console.error('Error removing recipe:', error);
      alert('Failed to remove recipe. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📂</div>
          <p className="text-lg">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-gray-300 mb-4">Error loading collection</p>
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

  if (!collection) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-center">
          <div className="text-6xl mb-4">📂</div>
          <p className="text-xl text-gray-300 mb-4">Collection not found</p>
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
      {/* Collection Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: collection.color }}
          />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{collection.name}</h2>
        </div>

        {collection.description && (
          <p className="text-lg sm:text-xl text-gray-300 mb-4">
            {collection.description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="text-gray-400">
            <span className="text-lg">
              {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
            </span>
          </div>

          <Link
            href={`/collections/${collection._id}/add-recipes`}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 text-base w-full sm:w-auto"
          >
            <span>+</span>
            <span>Add Recipes</span>
          </Link>
        </div>
      </div>

      {/* Collection Content */}
      {collection.recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl text-gray-300 mb-4">No recipes in this collection yet</p>
            <p className="text-gray-400 mb-6">
              Start building your collection by adding some recipes.
            </p>
            <Link
              href={`/collections/${collection._id}/add-recipes`}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Add Your First Recipe
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enhanced Recipe Grid with Remove Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {collection.recipes.map((recipe) => (
              <div
                key={recipe._id}
                className="bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-700 relative"
              >
                {/* Remove button for non-default collections */}
                {!collection.isDefault && (
                  <button
                    onClick={() => handleRemoveRecipe(recipe._id, recipe.title)}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center text-sm z-10 hover:scale-110"
                    aria-label={`Remove ${recipe.title} from collection`}
                    title="Remove from collection"
                  >
                    ✕
                  </button>
                )}

                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2 pr-10">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1.5 sm:gap-0">
                      <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full capitalize ${
                        recipe.category === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
                        recipe.category === 'lunch' ? 'bg-blue-900 text-blue-300' :
                        recipe.category === 'dinner' ? 'bg-purple-900 text-purple-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {recipe.category}
                      </span>
                      {/* Ownership indicator */}
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
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2 pr-10">{recipe.title}</h4>
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                    {recipe.description}
                  </p>
                  <div className="grid grid-cols-2 sm:flex sm:justify-between items-center text-xs text-gray-400 mb-3 sm:mb-4 gap-2 sm:gap-0">
                    <span>{recipe.macros.calories} cal</span>
                    <span>{recipe.macros.protein}g protein</span>
                    <span>{recipe.macros.carbs}g carbs</span>
                    <span>{recipe.macros.fat}g fat</span>
                  </div>
                  <Link
                    href={`/recipe/${recipe._id}`}
                    className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-500 transition-colors font-medium text-center text-sm sm:text-base"
                  >
                    View Recipe
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}