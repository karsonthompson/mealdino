import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";
import { getMealPlansByDateRange, formatDateForDB, getCurrentWeekRange } from "@/lib/mealPlans";
import PlanPageClient from "./PlanPageClient";

// Helper function to get the next few days
function getUpcomingDays(numDays = 7) {
  const days = [];
  const today = new Date();

  for (let i = 0; i < numDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    days.push({
      date: formatDateForDB(date),
      dateObj: date,
      formatted: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      shortFormatted: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }),
      isToday: i === 0,
      isTomorrow: i === 1
    });
  }

  return days;
}

export default async function PlanPage() {
  const session = await auth();

  // Get the next 7 days
  const upcomingDays = getUpcomingDays(7);

  // Get the date range for fetching meal plans
  const startDate = upcomingDays[0].date;
  const endDate = upcomingDays[upcomingDays.length - 1].date;

  // Fetch meal plans for this date range
  const mealPlans = await getMealPlansByDateRange(startDate, endDate);

  // Create a map for quick lookup
  const mealPlansByDate = mealPlans.reduce((acc, plan) => {
    acc[plan.date] = plan;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-3xl font-bold text-green-400 cursor-pointer hover:text-green-300">MealDino</h1>
              </Link>
              <span className="ml-2 text-lg text-gray-300">🦕</span>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className="text-gray-300 hover:text-green-400 font-medium">Recipes</Link>
                <Link href="/plan" className="text-green-400 font-medium">Plan</Link>
                <a href="#" className="text-gray-300 hover:text-green-400 font-medium">My Favorites</a>
              </nav>
              <ButtonLogin session={session} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Meal <span className="text-green-400">Plan</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Schedule your meals and cooking sessions. Plan ahead, eat better.
          </p>
        </div>

        <PlanPageClient
          upcomingDays={upcomingDays}
          mealPlansByDate={mealPlansByDate}
        />
      </main>
    </div>
  );
}