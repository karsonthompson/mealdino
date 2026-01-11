import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ButtonLogin from "@/components/ButtonLogin";

export default async function Home() {
  const session = await auth();

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-green-400">MealDino</h1>
              <span className="ml-2 text-base sm:text-lg text-gray-300">🦕</span>
            </div>
            <div className="flex items-center">
              <ButtonLogin session={session} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Welcome to
            <span className="text-green-400"> MealDino</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
            Stop overthinking what to eat. Discover clean, healthy recipes with ingredients you can trust.
            Plan your meals and simplify your cooking.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-4 sm:p-6 lg:p-8 border border-gray-700">
          <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4 sm:mb-6">
            Get Started Today
          </h3>
          <p className="text-gray-300 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Sign in to access your personal recipe collection, meal planning tools, and more.
          </p>

          <div className="space-y-4">
            <ButtonLogin session={session} />
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700">
            <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">What you&apos;ll get access to:</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Curated healthy recipes
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Personal meal planning
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Save your favorites
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Track your cooking schedule
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

