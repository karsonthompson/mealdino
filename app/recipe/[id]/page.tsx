import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/recipes";
import { auth } from "@/auth";
import RecipeActions from "./RecipeActions";

export default async function RecipePage({ params }: { params: { id: string } }) {
  const recipe = await getRecipeById(params.id);
  const session = await auth();

  // If recipe doesn't exist, show 404
  if (!recipe) {
    notFound();
  }

  // Check if the current user owns this recipe
  const isOwner = session?.user?.id === recipe.userId;
  const canEdit = isOwner && !recipe.isGlobal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl sm:text-3xl font-bold text-green-400 cursor-pointer hover:text-green-300">
                  MealDino
                </h1>
              </Link>
              <span className="ml-2 text-base sm:text-lg text-gray-300">🦕</span>
            </div>
            <Link href="/recipes">
              <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                ← Back to Recipes
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Recipe Header */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden mb-6 sm:mb-8">

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
              <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full capitalize ${
                recipe.category === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
                recipe.category === 'lunch' ? 'bg-blue-900 text-blue-300' :
                recipe.category === 'dinner' ? 'bg-purple-900 text-purple-300' :
                'bg-green-900 text-green-300'
              }`}>
                {recipe.category}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300 text-sm sm:text-base">{recipe.prepTime} minutes</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300 text-sm sm:text-base">Serves {recipe.recipeServings || 1}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white pr-0 sm:pr-4">
                {recipe.title}
              </h1>
              {canEdit && (
                <div className="flex-shrink-0">
                  <RecipeActions
                    recipeId={recipe._id}
                    recipe={recipe}
                  />
                </div>
              )}
            </div>

            <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6">
              {recipe.description}
            </p>

            {/* Macros */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-700 rounded-lg">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-400">{recipe.macros.calories}</p>
                <p className="text-xs sm:text-sm text-gray-300">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-400">{recipe.macros.protein}g</p>
                <p className="text-xs sm:text-sm text-gray-300">Protein</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-400">{recipe.macros.carbs}g</p>
                <p className="text-xs sm:text-sm text-gray-300">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-400">{recipe.macros.fat}g</p>
                <p className="text-xs sm:text-sm text-gray-300">Fat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Ingredients</h2>
          <ul className="space-y-3">
            {recipe.ingredients.map((ingredient: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-green-400 mr-3">•</span>
                <span className="text-gray-300">{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions Section */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Instructions</h2>
          <ol className="space-y-3 sm:space-y-4">
            {recipe.instructions.map((instruction: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-medium mr-3 sm:mr-4 text-sm sm:text-base">
                  {index + 1}
                </span>
                <p className="text-sm sm:text-base text-gray-300 pt-0.5 sm:pt-1">{instruction}</p>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
