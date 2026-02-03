import { auth } from '@/auth';
import ButtonLogin from '@/components/ButtonLogin';
import Link from 'next/link';
import ShoppingPageClient from './ShoppingPageClient';
import { formatDateForDB } from '@/lib/mealPlans';

function getDefaultDateRange() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 13);

  return {
    start: formatDateForDB(startDate),
    end: formatDateForDB(endDate)
  };
}

export default async function ShoppingPage() {
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
              <nav className="flex flex-wrap justify-center sm:justify-end space-x-4 sm:space-x-8">
                <Link href="/recipes" className="text-gray-300 hover:text-green-400 font-medium text-sm sm:text-base">Recipes</Link>
                <Link href="/plan" className="text-gray-300 hover:text-green-400 font-medium text-sm sm:text-base">Plan</Link>
                <Link href="/shopping" className="text-green-400 font-medium text-sm sm:text-base">Shopping</Link>
                <Link href="/dashboard" className="text-gray-300 hover:text-green-400 font-medium text-sm sm:text-base">Dashboard</Link>
              </nav>
              <div className="w-full sm:w-auto flex justify-center">
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

        <ShoppingPageClient defaultStartDate={defaults.start} defaultEndDate={defaults.end} />
      </main>
    </div>
  );
}
