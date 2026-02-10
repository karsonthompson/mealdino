import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import TopNav from "@/components/TopNav";
import Link from "next/link";
import { getAllRecipes } from "@/lib/recipes";
import RecipesPageClient from "./RecipesPageClient";
import { redirect } from "next/navigation";

interface Recipe {
  _id: string;
  title: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  recipeServings: number;
  ingredients: string[];
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl: string;
  userId: string | null;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

export default async function RecipesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const userId = session?.user?.id || null;
  const recipes = await getAllRecipes(userId);

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
                  { href: "/recipes", label: "Recipes" },
                  { href: "/plan", label: "Plan" },
                  { href: "/shopping", label: "Shopping" },
                  { href: "/dashboard", label: "Dashboard" }
                ]}
              />
              <div className="hidden sm:flex sm:w-auto justify-center">
                <ButtonLogin session={session} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <RecipesPageClient
          initialRecipes={recipes}
          isAuthenticated={!!session}
        />
      </main>
    </div>
  );
}
