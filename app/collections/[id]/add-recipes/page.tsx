import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ButtonLogin from "@/components/ButtonLogin";
import TopNav from "@/components/TopNav";
import AddRecipesClient from "./AddRecipesClient";

export default async function AddRecipesPage({ params }: { params: { id: string } }) {
  const session = await auth();

  // Redirect if not authenticated
  if (!session || !session.user) {
    redirect("/recipes");
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
                activeHref="/collections"
                links={[
                  { href: "/recipes", label: "Recipes" },
                  { href: "/plan", label: "Plan" },
                  { href: "/dashboard", label: "Dashboard" }
                ]}
              />
              <div className="w-full sm:w-auto flex justify-center">
                <ButtonLogin session={session} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href={`/collections/${params.id}`}
              className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base"
            >
              ← Back to Collection
            </Link>
          </div>
        </div>

        <AddRecipesClient collectionId={params.id} />
      </main>
    </div>
  );
}
