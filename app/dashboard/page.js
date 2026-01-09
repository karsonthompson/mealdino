import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";

export default async function Dashboard() {
    const session = await auth();

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
                                <Link href="/recipes" className="text-gray-300 hover:text-green-400 font-medium">Recipes</Link>
                                <Link href="/plan" className="text-gray-300 hover:text-green-400 font-medium">Plan</Link>
                                <Link href="/dashboard" className="text-green-400 font-medium">Dashboard</Link>
                            </nav>
                            <ButtonLogin session={session} />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Welcome to your <span className="text-green-400">Dashboard</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Your personal hub for meal planning, recipe management, and cooking organization.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/recipes" className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-400 transition-colors">
                        <h3 className="text-xl font-semibold text-white mb-2">Browse Recipes</h3>
                        <p className="text-gray-300">Discover healthy recipes curated just for you</p>
                    </Link>

                    <Link href="/plan" className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-green-400 transition-colors">
                        <h3 className="text-xl font-semibold text-white mb-2">Meal Planning</h3>
                        <p className="text-gray-300">Plan your meals and cooking sessions</p>
                    </Link>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold text-white mb-2">My Favorites</h3>
                        <p className="text-gray-300">Quick access to your saved recipes</p>
                    </div>
                </div>
            </main>
        </div>
    );
}