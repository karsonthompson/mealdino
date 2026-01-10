import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getRecipeById } from "@/lib/recipes";
import EditRecipeForm from "./EditRecipeForm";

export default async function EditRecipePage({ params }: { params: { id: string } }) {
  const session = await auth();

  // Redirect if not authenticated
  if (!session || !session.user) {
    redirect("/recipes");
  }

  // Get the recipe to edit
  const recipe = await getRecipeById(params.id);

  // If recipe doesn't exist, show 404
  if (!recipe) {
    notFound();
  }

  // Check if the user owns this recipe
  const isOwner = session.user.id === recipe.userId;
  const canEdit = isOwner && !recipe.isGlobal;

  // If user doesn't own the recipe, redirect to recipe view
  if (!canEdit) {
    redirect(`/recipe/${params.id}`);
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
              href={`/recipe/${params.id}`}
              className="text-gray-400 hover:text-green-400 transition-colors"
            >
              ← Back to Recipe
            </Link>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Edit Recipe</h2>
          <p className="text-xl text-gray-300">
            Update your recipe details below.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-8">
          <EditRecipeForm recipe={recipe} />
        </div>
      </main>
    </div>
  );
}