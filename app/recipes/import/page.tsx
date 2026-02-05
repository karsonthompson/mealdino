import { auth } from '@/auth';
import ButtonLogin from '@/components/ButtonLogin';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ImportRecipesClient from './ImportRecipesClient';

export default async function ImportRecipesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/recipes');
  }

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
                activeHref="/recipes"
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
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-4 mb-3 sm:mb-4">
            <Link href="/recipes" className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base">
              ← Back to Recipes
            </Link>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">Import Recipes</h2>
          <p className="text-lg sm:text-xl text-gray-300">Upload recipe docs, review parsed drafts, and import them in bulk.</p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 sm:p-6 lg:p-8">
          <ImportRecipesClient />
        </div>
      </main>
    </div>
  );
}
