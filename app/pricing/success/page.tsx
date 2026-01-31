import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";

export default async function SubscriptionSuccessPage() {
  const session = await auth();

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
                <Link href="/dashboard" className="text-gray-300 hover:text-green-400 font-medium text-sm sm:text-base">Dashboard</Link>
                <Link href="/pricing" className="text-gray-300 hover:text-green-400 font-medium text-sm sm:text-base">Pricing</Link>
              </nav>
              <div className="w-full sm:w-auto flex justify-center">
                <ButtonLogin session={session} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          {/* Success icon */}
          <div className="mx-auto w-20 h-20 bg-green-400/10 rounded-full flex items-center justify-center mb-8 border-2 border-green-400">
            <svg
              className="w-10 h-10 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Welcome to <span className="text-green-400">MealDino Pro</span>! 🦕
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-lg mx-auto">
            Your subscription is active. You now have full access to all features.
            Time to plan some amazing meals!
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-semibold text-lg shadow-lg shadow-green-600/25"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/plan"
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-lg"
            >
              Start Planning
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
