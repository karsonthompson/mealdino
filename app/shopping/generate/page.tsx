import { auth } from '@/auth';
import ButtonLogin from '@/components/ButtonLogin';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { getAllRecipes } from '@/lib/recipes';
import GenerateShoppingListClient from './GenerateShoppingListClient';

interface RecipeSummary {
  _id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  recipeServings: number;
  isGlobal: boolean;
}

export default async function GenerateShoppingPage() {
  const session = await auth();

  if (!session || !session.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please log in to build your shopping list.</p>
          <ButtonLogin session={null} />
        </div>
      </div>
    );
  }

  const recipes = await getAllRecipes(session.user.id);
  const recipeSummaries: RecipeSummary[] = recipes.map((recipe) => ({
    _id: recipe._id,
    title: recipe.title,
    category: recipe.category,
    prepTime: recipe.prepTime,
    recipeServings: recipe.recipeServings || 1,
    isGlobal: recipe.isGlobal
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <Link href="/dashboard">
                <h1 className="text-2xl sm:text-3xl font-bold text-green-400 cursor-pointer hover:text-green-300">MealDino</h1>
              </Link>
              <span className="ml-2 text-base sm:text-lg text-gray-300">🦕</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-8 w-full sm:w-auto">
              <TopNav
                hasSession={!!session?.user}
                activeHref="/shopping"
                links={[
                  { href: '/recipes', label: 'Recipes' },
                  { href: '/plan', label: 'Plan' },
                  { href: '/shopping', label: 'Shopping' },
                  { href: '/dashboard', label: 'Dashboard' }
                ]}
              />
              <div className="hidden sm:flex sm:w-auto justify-center">
                <ButtonLogin session={session} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Generate <span className="text-green-400">Shopping List</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
            Build from selected recipes, or choose a collection and date range to include only collection meals in your plan window.
          </p>
        </div>

        <GenerateShoppingListClient recipes={recipeSummaries} />
      </main>
    </div>
  );
}
