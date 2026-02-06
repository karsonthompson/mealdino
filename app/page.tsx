import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";

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
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="hidden sm:inline-flex whitespace-nowrap rounded-md px-3 py-2 text-gray-300 hover:text-green-400 hover:bg-gray-700/60 font-medium text-sm"
              >
                Pricing
              </Link>
              <ButtonLogin session={session} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <section className="text-center mb-12 sm:mb-16">
          <p className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-900/40 text-green-300 border border-green-700 mb-4">
            Healthy lifestyle meal planning
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4">
            Meal planning that actually gets used
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-7">
            Import recipes, generate plans from your collections, and get shopping lists that scale with your servings.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <ButtonLogin session={session} />
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-600 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              See How It Works
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
            <p className="text-white font-semibold">Plan faster</p>
            <p className="text-sm text-gray-400 mt-1">Build weekly plans in minutes from your saved recipes.</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
            <p className="text-white font-semibold">Shop smarter</p>
            <p className="text-sm text-gray-400 mt-1">Auto-generated shopping lists with serving-aware scaling.</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
            <p className="text-white font-semibold">Stay consistent</p>
            <p className="text-sm text-gray-400 mt-1">Follow a simple routine that fits your schedule.</p>
          </div>
        </section>

        <section id="how-it-works" className="rounded-xl border border-gray-700 bg-gray-800 p-5 sm:p-6 mb-10">
          <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
              <p className="text-green-300 text-xs font-semibold mb-1">Step 1</p>
              <p className="text-white font-semibold">Import or create recipes</p>
              <p className="text-sm text-gray-400 mt-1">Bring in your own recipe docs or add recipes manually.</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
              <p className="text-green-300 text-xs font-semibold mb-1">Step 2</p>
              <p className="text-white font-semibold">Generate plans from collections</p>
              <p className="text-sm text-gray-400 mt-1">Choose your date range and meal types, then generate.</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
              <p className="text-green-300 text-xs font-semibold mb-1">Step 3</p>
              <p className="text-white font-semibold">Shop with confidence</p>
              <p className="text-sm text-gray-400 mt-1">Get a clean shopping list built from your plan automatically.</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
            <h4 className="text-lg font-semibold text-white mb-2">Core Features</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Collection-based meal plan generation</li>
              <li>Serving-aware ingredient scaling</li>
              <li>Meal prep and daily planning support</li>
              <li>Mobile-friendly shopping workflow</li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
            <h4 className="text-lg font-semibold text-white mb-2">Built for Real-Life Use</h4>
            <p className="text-sm text-gray-300">
              Ideal for anyone who wants a repeatable healthy routine, including users importing recipe packs and generating plans quickly.
            </p>
            <div className="mt-4">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-5 sm:p-6 mb-10">
          <h3 className="text-xl font-semibold text-white mb-3">Frequently Asked Questions</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <p className="text-white font-medium">Can I import recipes from documents or PDFs?</p>
              <p className="text-gray-400">Yes. You can import recipes and build collections from them.</p>
            </div>
            <div>
              <p className="text-white font-medium">Can I plan only certain meal types?</p>
              <p className="text-gray-400">Yes. You can generate plans for only the meal types you want.</p>
            </div>
            <div>
              <p className="text-white font-medium">Does the shopping list adjust by servings?</p>
              <p className="text-gray-400">Yes. Ingredient quantities scale based on planned servings.</p>
            </div>
          </div>
        </section>

        <section className="text-center rounded-xl border border-green-700/40 bg-green-900/15 p-6 sm:p-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to simplify healthy eating?</h3>
          <p className="text-gray-300 mb-5">Create your account and start planning smarter today.</p>
          <div className="flex justify-center">
            <ButtonLogin session={session} />
          </div>
        </section>
      </main>
    </div>
  );
}
