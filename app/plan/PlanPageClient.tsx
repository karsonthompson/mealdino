'use client';

import { useState } from 'react';
import AddMealModal from './AddMealModal';

// TypeScript interfaces for meal plan data structures
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

interface UpcomingDay {
  date: string;
  dateObj: Date;
  formatted: string;
  shortFormatted: string;
  isToday: boolean;
  isTomorrow: boolean;
}

interface PlanPageClientProps {
  upcomingDays: UpcomingDay[];
  mealPlansByDate: { [key: string]: MealPlan };
}

export default function PlanPageClient({ upcomingDays, mealPlansByDate }: PlanPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Day Panels */}
      <div className="space-y-6">
        {upcomingDays.map((day: UpcomingDay) => {
          const dayMealPlan = mealPlansByDate[day.date];
          const dayTitle = day.isToday ? 'Today' : day.isTomorrow ? 'Tomorrow' : day.shortFormatted.split(',')[0];

          return (
            <div key={day.date} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white">{dayTitle}</h3>
                <p className="text-gray-400">{day.formatted}</p>
              </div>

              {/* Meals Section */}
              <div className="space-y-4">
                {dayMealPlan && dayMealPlan.meals.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-white mb-3">Planned Meals</h4>
                    {dayMealPlan.meals.map((meal: Meal, index: number) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                                meal.type === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
                                meal.type === 'lunch' ? 'bg-blue-900 text-blue-300' :
                                meal.type === 'dinner' ? 'bg-purple-900 text-purple-300' :
                                'bg-green-900 text-green-300'
                              }`}>
                                {meal.type}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                meal.source === 'meal_prep' ? 'bg-orange-900 text-orange-300' :
                                meal.source === 'leftovers' ? 'bg-gray-900 text-gray-300' :
                                'bg-gray-900 text-gray-300'
                              }`}>
                                {meal.source.replace('_', ' ')}
                              </span>
                            </div>
                            <h5 className="font-semibold text-white">{meal.recipe.title}</h5>
                            <p className="text-gray-400 text-sm">{meal.recipe.prepTime} min • {meal.recipe.macros.calories} cal</p>
                            {meal.notes && (
                              <p className="text-gray-300 text-sm mt-2 italic">&quot;{meal.notes}&quot;</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-3xl mb-2">🍽️</div>
                    <p className="text-md">No meals planned</p>
                    <p className="text-sm mt-1">Use the + button to add meals!</p>
                  </div>
                )}
              </div>

              {/* Cooking Sessions Section */}
              <div className="border-t border-gray-700 pt-6 mt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Cooking Sessions</h4>

                {dayMealPlan && dayMealPlan.cookingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {dayMealPlan.cookingSessions.map((session: CookingSession, index: number) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-900 text-orange-300">
                                {session.timeSlot}
                              </span>
                              <span className="px-2 py-1 text-xs rounded bg-gray-900 text-gray-300">
                                {session.purpose.replace('_', ' ')}
                              </span>
                              <span className="px-2 py-1 text-xs rounded bg-green-900 text-green-300">
                                {session.servings} servings
                              </span>
                            </div>
                            <h5 className="font-semibold text-white">Cook: {session.recipe.title}</h5>
                            <p className="text-gray-400 text-sm">{session.recipe.prepTime} min prep time</p>
                            {session.notes && (
                              <p className="text-gray-300 text-sm mt-2 italic">&quot;{session.notes}&quot;</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No cooking sessions planned</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Navigation Hint */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">Showing next 7 days • Use the + button to add meals 📅</p>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center text-2xl font-light z-50"
        aria-label="Add meal or cooking session"
      >
        +
      </button>

      {/* Modal */}
      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        upcomingDays={upcomingDays}
      />
    </>
  );
}