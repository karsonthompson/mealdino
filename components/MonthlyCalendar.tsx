'use client';

import { useState } from 'react';

interface Recipe {
  _id: string;
  title: string;
  category: string;
  prepTime: number;
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
}

interface CookingSession {
  recipe: Recipe;
  notes: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  servings: number;
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

interface MonthlyDay {
  date: string;
  dateObj: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isPrevMonth: boolean;
  isNextMonth: boolean;
  isToday: boolean;
  formatted: string;
}

interface MonthlyCalendarProps {
  monthlyDays: MonthlyDay[];
  mealPlansByDate: { [key: string]: MealPlan };
  currentYear: number;
  currentMonth: number;
  onMonthChange: (year: number, month: number) => void;
  onDayClick?: (date: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthlyCalendar({
  monthlyDays,
  mealPlansByDate,
  currentYear,
  currentMonth,
  onMonthChange,
  onDayClick
}: MonthlyCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(currentYear - 1, 11);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(currentYear + 1, 0);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  const handleDayClick = (day: MonthlyDay) => {
    setSelectedDay(day.date);
    onDayClick?.(day.date);
  };

  const getDayMealCount = (day: MonthlyDay) => {
    const mealPlan = mealPlansByDate[day.date];
    return mealPlan ? mealPlan.meals.length : 0;
  };

  const getDayCookingSessionCount = (day: MonthlyDay) => {
    const mealPlan = mealPlansByDate[day.date];
    return mealPlan ? mealPlan.cookingSessions.length : 0;
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-4 sm:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-xl sm:text-2xl font-bold text-white">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((dayName) => (
          <div key={dayName} className="p-2 text-center">
            <span className="text-sm font-medium text-gray-400">{dayName}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthlyDays.map((day) => {
          const mealCount = getDayMealCount(day);
          const cookingSessionCount = getDayCookingSessionCount(day);
          const hasContent = mealCount > 0 || cookingSessionCount > 0;
          const isSelected = selectedDay === day.date;

          return (
            <div
              key={day.date}
              onClick={() => handleDayClick(day)}
              className={`
                relative min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 rounded-lg border cursor-pointer transition-all duration-200
                ${day.isCurrentMonth
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-900 border-gray-800 text-gray-500'
                }
                ${day.isToday ? 'ring-2 ring-green-500' : ''}
                ${isSelected ? 'bg-gray-600 border-green-500' : ''}
              `}
            >
              {/* Day Number */}
              <div className={`text-sm sm:text-base font-medium mb-1 ${
                day.isToday ? 'text-green-400' : day.isCurrentMonth ? 'text-white' : 'text-gray-500'
              }`}>
                {day.dayNumber}
              </div>

              {/* Content Indicators */}
              <div className="space-y-1">
                {mealCount > 0 && (
                  <div className="flex items-center text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    <span className="text-gray-300 hidden sm:inline">
                      {mealCount} meal{mealCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-300 sm:hidden">
                      {mealCount}M
                    </span>
                  </div>
                )}
                {cookingSessionCount > 0 && (
                  <div className="flex items-center text-xs">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                    <span className="text-gray-300 hidden sm:inline">
                      {cookingSessionCount} session{cookingSessionCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-300 sm:hidden">
                      {cookingSessionCount}S
                    </span>
                  </div>
                )}
              </div>

              {/* Today indicator */}
              {day.isToday && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span>Meals</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            <span>Cooking Sessions</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>Today</span>
          </div>
        </div>
      </div>

    </div>
  );
}
