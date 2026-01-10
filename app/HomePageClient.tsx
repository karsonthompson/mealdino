'use client';

import { useState } from 'react';
import Link from 'next/link';
import QuickAddModal from './QuickAddModal';

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

interface HomePageClientProps {
  recipes: Recipe[];
}

export default function HomePageClient({ recipes }: HomePageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleQuickAdd = (recipe: Recipe, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to recipe detail page
    e.stopPropagation(); // Stop event bubbling
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 text-center">
              <div className="text-4xl mb-2">🍽️</div>
              <p className="text-lg text-gray-300">No recipes found</p>
              <p className="text-sm text-gray-400 mt-2">Be the first to add a recipe!</p>
            </div>
          </div>
        ) : (
          recipes.map((recipe) => (
            <div
              key={recipe._id}
              className="bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-700 relative"
            >
              {/* Quick Add Button */}
              <button
                onClick={(e) => handleQuickAdd(recipe, e)}
                className="absolute top-3 right-3 w-8 h-8 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center text-lg font-light z-10 hover:scale-110"
                aria-label={`Add ${recipe.title} to meal plan`}
                title="Add to meal plan"
              >
                +
              </button>

              <div className="p-6">
                <div className="flex items-center justify-between mb-2 pr-10">
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                      recipe.category === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
                      recipe.category === 'lunch' ? 'bg-blue-900 text-blue-300' :
                      recipe.category === 'dinner' ? 'bg-purple-900 text-purple-300' :
                      'bg-green-900 text-green-300'
                    }`}>
                      {recipe.category}
                    </span>
                    {/* Ownership indicator */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      recipe.isGlobal
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-green-900 text-green-300'
                    }`}>
                      {recipe.isGlobal ? 'Global' : 'Your Recipe'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">{recipe.prepTime} min</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2 pr-10">{recipe.title}</h4>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {recipe.description}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                  <span>{recipe.macros.calories} cal</span>
                  <span>{recipe.macros.protein}g protein</span>
                  <span>{recipe.macros.carbs}g carbs</span>
                  <span>{recipe.macros.fat}g fat</span>
                </div>
                <Link
                  href={`/recipe/${recipe._id}`}
                  className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-500 transition-colors font-medium text-center"
                >
                  View Recipe
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipe={selectedRecipe}
      />
    </>
  );
}