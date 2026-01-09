import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";
import { getAllRecipes } from "@/lib/recipes";
import HomePageClient from "./HomePageClient";

interface Recipe {
  _id: string;
  title: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

// This function is no longer needed - we'll use getAllRecipes directly

export default async function Home() {
  const session = await auth();
  const recipes = await getAllRecipes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-green-400">MealDino</h1>
              <span className="ml-2 text-lg text-gray-300">🦕</span>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className="text-green-400 font-medium">Recipes</Link>
                <Link href="/plan" className="text-gray-300 hover:text-green-400 font-medium">Plan</Link>
                <a href="#" className="text-gray-300 hover:text-green-400 font-medium">My Favorites</a>
              </nav>
              <ButtonLogin session={session} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Healthy Eating,
            <span className="text-green-400"> Simplified</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Stop overthinking what to eat. Discover clean, healthy recipes with ingredients you can trust.
            Just click, cook, and enjoy.
          </p>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-semibold text-white">Today&apos;s Recipes</h3>
            <div className="flex space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-green-400 bg-green-900 rounded-full hover:bg-green-800 transition-colors">
                All
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                Breakfast
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                Lunch
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                Dinner
              </button>
            </div>
          </div>

          <HomePageClient recipes={recipes} />
        </div>
      </main>
    </div>
  );
}

