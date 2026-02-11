import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import TopNav from "@/components/TopNav";
import { checkSubscription } from "@/lib/subscription";
import Link from "next/link";

export default async function Dashboard() {
    const session = await auth();
    const { isSubscribed } = await checkSubscription();
    const billingHref = "/pricing";
    const billingLabel = isSubscribed ? "Manage Billing" : "Checkout";

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
                activeHref="/dashboard"
                                links={[
                                    { href: "/recipes", label: "Recipes" },
                                    { href: "/plan", label: "Plan" },
                                    { href: "/shopping", label: "Shopping" },
                                    { href: "/agent", label: "Agent" },
                                    { href: "/dashboard", label: "Dashboard" },
                                    { href: "/pricing", label: "Pricing" }
                                ]}
                            />
                            <div className="hidden sm:flex sm:w-auto justify-center">
                                <ButtonLogin session={session} />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        Welcome to your <span className="text-green-400">Dashboard</span>
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4 sm:px-0">
                        Your personal hub for meal planning, recipe management, and cooking organization.
                    </p>
                    <div className="mt-6">
                        <Link
                            href={billingHref}
                            className="inline-flex items-center rounded-lg bg-green-500 px-5 py-3 font-semibold text-gray-900 hover:bg-green-400"
                        >
                            {billingLabel}
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Link href="/recipes" className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 hover:border-green-400 transition-colors">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Browse Recipes</h3>
                        <p className="text-sm sm:text-base text-gray-300">Discover healthy recipes curated just for you</p>
                    </Link>

                    <Link href="/plan" className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 hover:border-green-400 transition-colors">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Meal Planning</h3>
                        <p className="text-sm sm:text-base text-gray-300">Plan your meals and cooking sessions</p>
                    </Link>

                    <Link href="/shopping" className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 hover:border-green-400 transition-colors">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Shopping List</h3>
                        <p className="text-sm sm:text-base text-gray-300">Auto-generate groceries from your plan</p>
                    </Link>

                    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Upgrade to Premium</h3>
                        <p className="text-sm sm:text-base text-gray-300 mb-4">
                            {isSubscribed
                                ? "Manage your subscription and payment details."
                                : "Start Stripe checkout directly from your dashboard"}
                        </p>
                        <Link
                            href={billingHref}
                            className="inline-flex items-center rounded-lg bg-green-500 px-5 py-3 font-semibold text-gray-900 hover:bg-green-400"
                        >
                            {billingLabel}
                        </Link>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">My Favorites</h3>
                        <p className="text-sm sm:text-base text-gray-300">Quick access to your saved recipes</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
