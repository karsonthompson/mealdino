import { auth } from "@/auth";
import ButtonLogin from "@/components/ButtonLogin";
import Link from "next/link";
import { getMealPlansByDateRange, formatDateForDB, getCurrentWeekRange, getCurrentMonthRange, getMonthRange, getMonthlyDays } from "@/lib/mealPlans";
import PlanPageClient from "./PlanPageClient";

interface Recipe {
  _id: string;
  title: string;
  category: string;
  prepTime: number;
  recipeServings: number;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: Recipe;
  notes: string;
  source: 'fresh' | 'meal_prep' | 'leftovers' | 'frozen';
  plannedServings: number;
  excludeFromShopping: boolean;
}

interface CookingSession {
  recipe: Recipe;
  notes: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  servings: number;
  plannedServings: number;
  excludeFromShopping: boolean;
  purpose: 'meal_prep' | 'batch_cooking' | 'weekly_prep' | 'daily_cooking';
}

interface MealPlan {
  _id: string;
  date: string;
  meals: Meal[];
  cookingSessions: CookingSession[];
  createdAt: string;
  updatedAt: string;
}

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

interface PlanPageSearchParams {
  view?: 'weekly' | 'monthly';
  month?: string; // Format: YYYY-MM
  days?: string; // 7 or 14
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
}

function getDaysBetween(startDate: string, endDate: string) {
  const days = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const current = new Date(start);

  while (current <= end) {
    days.push({
      date: formatDateForDB(current),
      dateObj: new Date(current),
      formatted: current.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      shortFormatted: current.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }),
      isToday: formatDateForDB(current) === formatDateForDB(new Date()),
      isTomorrow: formatDateForDB(current) === formatDateForDB(new Date(Date.now() + 24 * 60 * 60 * 1000))
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export default async function PlanPage({
  searchParams
}: {
  searchParams: PlanPageSearchParams;
}) {
  const session = await auth();

  // Redirect if not authenticated
  if (!session || !session.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please log in to view your meal plan.</p>
          <ButtonLogin session={null} />
        </div>
      </div>
    );
  }

  // Determine view mode and date range
  const viewMode = searchParams.view || 'weekly';
  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();

  // Parse month parameter if provided
  if (searchParams.month && viewMode === 'monthly') {
    const [year, month] = searchParams.month.split('-').map(Number);
    if (year && month && month >= 1 && month <= 12) {
      currentYear = year;
      currentMonth = month - 1; // Convert to 0-based month
    }
  }

  let startDate: string;
  let endDate: string;
  let upcomingDays: any[] = [];
  let monthlyDays: any[] = [];

  if (viewMode === 'monthly') {
    // Get monthly date range
    const monthRange = getMonthRange(currentYear, currentMonth);
    startDate = monthRange.startDate;
    endDate = monthRange.endDate;

    // Generate monthly calendar days
    monthlyDays = getMonthlyDays(currentYear, currentMonth);
  } else {
    const startParam = searchParams.start;
    const endParam = searchParams.end;

    if (startParam && endParam) {
      upcomingDays = getDaysBetween(startParam, endParam);
      startDate = startParam;
      endDate = endParam;
    } else {
      const parsedDays = Number(searchParams.days || '7');
      const horizonDays = parsedDays === 14 ? 14 : 7;
      upcomingDays = getUpcomingDays(horizonDays);
      startDate = upcomingDays[0].date;
      endDate = upcomingDays[upcomingDays.length - 1].date;
    }
  }

  // Get user ID from session
  const userId = session.user.id;

  if (!userId) {
    console.error('User ID not found in session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userIdFromUser: session?.user?.id
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-300">Unable to identify user. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  // Fetch meal plans for this date range for the current user
  const mealPlans = await getMealPlansByDateRange(startDate, endDate, userId);

  // Create a map for quick lookup
  const mealPlansByDate = mealPlans.reduce((acc: { [key: string]: MealPlan }, plan: MealPlan) => {
    acc[plan.date] = plan;
    return acc;
  }, {});

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
              <nav className="flex flex-wrap justify-center sm:justify-end space-x-4 sm:space-x-8">
                <Link href="/recipes" className="text-gray-300 hover:text-green-400 font-medium text-sm sm:text-base">Recipes</Link>
                <Link href="/plan" className="text-green-400 font-medium text-sm sm:text-base">Plan</Link>
                <Link href="/shopping" className="text-gray-300 hover:text-green-400 font-medium text-sm sm:text-base">Shopping</Link>
                <Link href="/dashboard" className="text-gray-300 hover:text-green-400 font-medium text-sm sm:text-base">Dashboard</Link>
              </nav>
              <div className="w-full sm:w-auto flex justify-center">
                <ButtonLogin session={session} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Meal <span className="text-green-400">Plan</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4 sm:px-0">
            Schedule your meals and cooking sessions. Plan ahead, eat better.
          </p>
        </div>

        <PlanPageClient
          viewMode={viewMode}
          upcomingDays={upcomingDays}
          monthlyDays={monthlyDays}
          currentYear={currentYear}
          currentMonth={currentMonth}
          mealPlansByDate={mealPlansByDate}
        />
      </main>
    </div>
  );
}
