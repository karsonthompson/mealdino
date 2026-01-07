import Link from "next/link";
import { notFound } from "next/navigation";

// Function to fetch a single recipe
async function getRecipe(id: string) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recipes/${id}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Error loading recipe:', error);
    return null;
  }
}

export default async function RecipePage({ params }: { params: { id: string } }) {
  const recipe = await getRecipe(params.id);

  // If recipe doesn't exist, show 404
  if (!recipe) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-3xl font-bold text-green-400 cursor-pointer hover:text-green-300">
                  MealDino
                </h1>
              </Link>
              <span className="ml-2 text-lg text-gray-300">🦕</span>
            </div>
            <Link href="/">
              <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                ← Back to Recipes
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Recipe Header */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center overflow-hidden">
            {recipe.imageUrl && recipe.imageUrl !== 'https://via.placeholder.com/400x300?text=Recipe+Image' ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-500 text-center">
                <div className="text-6xl mb-4">🍽️</div>
                <p className="text-sm">Recipe Image</p>
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${
                recipe.category === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
                recipe.category === 'lunch' ? 'bg-blue-900 text-blue-300' :
                recipe.category === 'dinner' ? 'bg-purple-900 text-purple-300' :
                'bg-green-900 text-green-300'
              }`}>
                {recipe.category}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300">{recipe.prepTime} minutes</span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              {recipe.title}
            </h1>

            <p className="text-lg text-gray-300 mb-6">
              {recipe.description}
            </p>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-gray-700 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{recipe.macros.calories}</p>
                <p className="text-sm text-gray-300">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{recipe.macros.protein}g</p>
                <p className="text-sm text-gray-300">Protein</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{recipe.macros.carbs}g</p>
                <p className="text-sm text-gray-300">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{recipe.macros.fat}g</p>
                <p className="text-sm text-gray-300">Fat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Ingredients</h2>
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
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-medium mr-4">
                  {index + 1}
                </span>
                <p className="text-gray-300 pt-1">{instruction}</p>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}