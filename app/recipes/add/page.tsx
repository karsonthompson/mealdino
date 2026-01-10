import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";
import { redirect } from "next/navigation";
import RecipeForm from "../components/RecipeForm";

export default async function AddRecipePage() {
  const session = await auth();

  // Redirect if not authenticated
  if (!session || !session.user) {
    redirect("/recipes");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard">
                <h1 className="text-3xl font-bold text-green-400 cursor-pointer hover:text-green-300">MealDino</h1>
              </Link>
              <span className="ml-2 text-lg text-gray-300">🦕</span>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                <Link href="/recipes" className="text-green-400 font-medium">Recipes</Link>
                <Link href="/plan" className="text-gray-300 hover:text-green-400 font-medium">Plan</Link>
                <Link href="/dashboard" className="text-gray-300 hover:text-green-400 font-medium">Dashboard</Link>
              </nav>
              <ButtonLogin session={session} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/recipes"
              className="text-gray-400 hover:text-green-400 transition-colors"
            >
              ← Back to Recipes
            </Link>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Add New Recipe</h2>
          <p className="text-xl text-gray-300">
            Create your own custom recipe to add to your meal planning collection.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-8">
          <RecipeForm />
        </div>
      </main>
    </div>
  );
}