import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";
import { getAllRecipes } from "@/lib/recipes";

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
  createdAt: string;
  updatedAt: string;
}

// This function is no longer needed - we'll use getAllRecipes directly

export default async function Home() {
  const session = await auth();
  const recipes = await getAllRecipes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-green-400">MealDino</h1>
              <span className="ml-2 text-lg text-gray-300">🦕</span>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-300 hover:text-green-400 font-medium">Recipes</a>
                <a href="#" className="text-gray-300 hover:text-green-400 font-medium">My Favorites</a>
                <a href="#" className="text-gray-300 hover:text-green-400 font-medium">Meal Planner</a>
              </nav>
              <ButtonLogin session={session} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Healthy Eating,
            <span className="text-green-400"> Simplified</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Stop overthinking what to eat. Discover clean, healthy recipes with ingredients you can trust.
            Just click, cook, and enjoy.
          </p>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-semibold text-white">Today&apos;s Recipes</h3>
            <div className="flex space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-green-400 bg-green-900 rounded-full hover:bg-green-800 transition-colors">
                All
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                Breakfast
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                Lunch
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                Dinner
              </button>
            </div>
          </div>

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
                  className="bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-700"
                >
                  <div className="h-48 bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl flex items-center justify-center overflow-hidden">
                    {recipe.imageUrl && recipe.imageUrl !== 'https://via.placeholder.com/400x300?text=Recipe+Image' ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-500 text-center">
                        <div className="text-4xl mb-2">🍽️</div>
                        <p className="text-sm">Recipe Image</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                        recipe.category === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
                        recipe.category === 'lunch' ? 'bg-blue-900 text-blue-300' :
                        recipe.category === 'dinner' ? 'bg-purple-900 text-purple-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {recipe.category}
                      </span>
                      <span className="text-sm text-gray-400">{recipe.prepTime} min</span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">{recipe.title}</h4>
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
        </div>
      </main>
    </div>
  );
}

