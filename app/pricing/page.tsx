import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";
import PricingPageClient from "./PricingPageClient";

export default async function PricingPage() {
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
                <Link href="/pricing" className="text-green-400 font-medium text-sm sm:text-base">Pricing</Link>
              </nav>
              <div className="w-full sm:w-auto flex justify-center">
                <ButtonLogin session={session} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Simple <span className="text-green-400">Pricing</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4 sm:px-0">
            One plan. Everything included. Cancel anytime.
          </p>
        </div>

        <PricingPageClient isAuthenticated={!!session?.user} />
      </main>
    </div>
  );
}
