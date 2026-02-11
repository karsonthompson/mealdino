import { auth } from '@/auth';
import ButtonLogin from '@/components/ButtonLogin';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import ShoppingPageClient from './ShoppingPageClient';
import { formatDateForDB } from '@/lib/mealPlans';

interface SelectedRecipeInput {
  recipeId: string;
  plannedServings: number;
}

function parseSelectedRecipesParam(raw?: string): SelectedRecipeInput[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => ({
        recipeId: String(entry?.recipeId || '').trim(),
        plannedServings: Number(entry?.plannedServings)
      }))
      .filter((entry) => entry.recipeId && Number.isFinite(entry.plannedServings) && entry.plannedServings > 0)
      .map((entry) => ({
        recipeId: entry.recipeId,
        plannedServings: Math.max(1, Math.round(entry.plannedServings * 100) / 100)
      }));
  } catch {
    return [];
  }
}

function getDefaultDateRange() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 13);

  return {
    start: formatDateForDB(startDate),
    end: formatDateForDB(endDate)
  };
}

export default async function ShoppingPage({
  searchParams
}: {
  searchParams: { source?: string; selectedRecipes?: string; collectionId?: string; start?: string; end?: string };
}) {
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

  const defaults = getDefaultDateRange();
  const sourceMode = searchParams.source === 'recipes'
    ? 'recipes'
    : searchParams.source === 'collection'
      ? 'collection'
      : 'plan';
  const selectedRecipes = sourceMode === 'recipes'
    ? parseSelectedRecipesParam(searchParams.selectedRecipes)
    : [];
  const selectedCollectionId = sourceMode === 'collection' ? String(searchParams.collectionId || '') : '';
  const defaultStartDate = String(searchParams.start || defaults.start);
  const defaultEndDate = String(searchParams.end || defaults.end);

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
                  { href: '/agent', label: 'Agent' },
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
            Smart <span className="text-green-400">Shopping List</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
            Pick your planning window and MealDino will aggregate ingredients from your planned meals and cooking sessions.
          </p>
        </div>

        <ShoppingPageClient
          defaultStartDate={defaultStartDate}
          defaultEndDate={defaultEndDate}
          sourceMode={sourceMode}
          selectedRecipes={selectedRecipes}
          selectedCollectionId={selectedCollectionId}
        />
      </main>
    </div>
  );
}
