'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddMealModal from './AddMealModal';
import ViewToggle from '@/components/ViewToggle';
import MonthlyCalendar from '@/components/MonthlyCalendar';

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

interface UpcomingDay {
  date: string;
  dateObj: Date;
  formatted: string;
  shortFormatted: string;
  isToday: boolean;
  isTomorrow: boolean;
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

interface PlanPageClientProps {
  viewMode: 'weekly' | 'monthly';
  upcomingDays: UpcomingDay[];
  monthlyDays: MonthlyDay[];
  currentYear: number;
  currentMonth: number;
  mealPlansByDate: { [key: string]: MealPlan };
}

interface DaySnapshot {
  date: string;
  plan?: MealPlan;
}

function serializeDayPlan(plan?: MealPlan) {
  if (!plan) {
    return { meals: [], cookingSessions: [] };
  }

  return {
    meals: (plan.meals || []).map((meal) => ({
      type: meal.type,
      recipe: meal.recipe._id,
      notes: meal.notes || '',
      source: meal.source,
      plannedServings: meal.plannedServings || 1,
      excludeFromShopping: meal.excludeFromShopping === true
    })),
    cookingSessions: (plan.cookingSessions || []).map((session) => ({
      recipe: session.recipe._id,
      notes: session.notes || '',
      timeSlot: session.timeSlot,
      servings: session.plannedServings || session.servings || 1,
      plannedServings: session.plannedServings || session.servings || 1,
      purpose: session.purpose,
      excludeFromShopping: session.excludeFromShopping === true
    }))
  };
}

export default function PlanPageClient({
  viewMode,
  upcomingDays,
  monthlyDays,
  currentYear,
  currentMonth,
  mealPlansByDate
}: PlanPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(upcomingDays[0]?.date || null);
  const [localMealPlansByDate, setLocalMealPlansByDate] = useState<{ [key: string]: MealPlan }>(mealPlansByDate);
  const [updatingServingsKey, setUpdatingServingsKey] = useState<string | null>(null);
  const [recentlySavedServingsKey, setRecentlySavedServingsKey] = useState<string | null>(null);
  const [updatingShoppingToggleKey, setUpdatingShoppingToggleKey] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionUndo, setActionUndo] = useState<(() => Promise<void> | void) | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [customStart, setCustomStart] = useState(upcomingDays[0]?.date || '');
  const [customEnd, setCustomEnd] = useState(upcomingDays[upcomingDays.length - 1]?.date || '');

  useEffect(() => {
    setLocalMealPlansByDate(mealPlansByDate);
  }, [mealPlansByDate]);

  useEffect(() => {
    setCustomStart(upcomingDays[0]?.date || '');
    setCustomEnd(upcomingDays[upcomingDays.length - 1]?.date || '');

    if (!selectedDate || !upcomingDays.some((day) => day.date === selectedDate)) {
      setSelectedDate(upcomingDays[0]?.date || null);
    }
  }, [upcomingDays, selectedDate]);

  const selectedDay = useMemo(
    () => upcomingDays.find((day) => day.date === selectedDate) || upcomingDays[0],
    [upcomingDays, selectedDate]
  );

  const selectedDayPlan = selectedDay ? localMealPlansByDate[selectedDay.date] : undefined;

  const showMessage = (message: string) => {
    setActionMessage(message);
    setActionUndo(null);
    setTimeout(() => setActionMessage(null), 1600);
  };

  const showUndoMessage = (message: string, onUndo: () => Promise<void> | void) => {
    setActionMessage(message);
    setActionUndo(() => onUndo);
    setTimeout(() => {
      setActionMessage(null);
      setActionUndo(null);
    }, 5000);
  };

  const restoreSnapshots = async (snapshots: DaySnapshot[]) => {
    if (snapshots.length === 0) return;
    setBulkSaving(true);
    try {
      const nextMap = { ...localMealPlansByDate };
      for (const snapshot of snapshots) {
        const restored = await saveDayPlan(snapshot.date, snapshot.plan);
        nextMap[snapshot.date] = restored;
      }
      setLocalMealPlansByDate(nextMap);
      showMessage('Undo complete');
    } catch (error) {
      console.error('Failed to restore snapshots:', error);
      alert('Failed to undo previous action.');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleViewChange = (newView: 'weekly' | 'monthly') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);

    if (newView === 'weekly') {
      params.delete('month');
    } else if (!params.has('month')) {
      const today = new Date();
      const monthParam = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      params.set('month', monthParam);
    }

    router.push(`/plan?${params.toString()}`);
  };

  const handleHorizonChange = (days: 7 | 14) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', 'weekly');
    params.set('days', String(days));
    params.delete('start');
    params.delete('end');
    router.push(`/plan?${params.toString()}`);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd || customStart > customEnd) {
      alert('Please choose a valid date range.');
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('view', 'weekly');
    params.set('start', customStart);
    params.set('end', customEnd);
    params.delete('days');
    router.push(`/plan?${params.toString()}`);
  };

  const handleMonthChange = (year: number, month: number) => {
    const params = new URLSearchParams(searchParams.toString());
    const monthParam = `${year}-${String(month + 1).padStart(2, '0')}`;
    params.set('month', monthParam);
    params.set('view', 'monthly');
    router.push(`/plan?${params.toString()}`);
  };

  const updateEntryServings = async (
    date: string,
    entryType: 'meal' | 'cooking_session',
    index: number,
    nextServings: number
  ) => {
    const safeServings = Math.max(1, nextServings);
    const entryKey = `${date}:${entryType}:${index}`;
    setUpdatingServingsKey(entryKey);

    try {
      const response = await fetch('/api/meal-plans/servings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, entryType, index, plannedServings: safeServings })
      });

      const result = await response.json();
      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || 'Failed to update servings');
      }

      setLocalMealPlansByDate((prev) => ({ ...prev, [date]: result.data }));
      setRecentlySavedServingsKey(entryKey);
      setTimeout(() => {
        setRecentlySavedServingsKey((current) => (current === entryKey ? null : current));
      }, 1200);
    } catch (error) {
      console.error('Failed to update planned servings:', error);
      alert('Failed to update servings. Please try again.');
    } finally {
      setUpdatingServingsKey(null);
    }
  };

  const toggleExcludeFromShopping = async (
    date: string,
    entryType: 'meal' | 'cooking_session',
    index: number,
    currentValue: boolean
  ) => {
    const entryKey = `${date}:${entryType}:${index}:shopping`;
    setUpdatingShoppingToggleKey(entryKey);

    try {
      const response = await fetch('/api/meal-plans/shopping', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, entryType, index, excludeFromShopping: !currentValue })
      });

      const result = await response.json();
      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || 'Failed to update shopping exclusion');
      }

      setLocalMealPlansByDate((prev) => ({ ...prev, [date]: result.data }));
    } catch (error) {
      console.error('Failed to update shopping exclusion:', error);
      alert('Failed to update shopping exclusion. Please try again.');
    } finally {
      setUpdatingShoppingToggleKey(null);
    }
  };

  const saveDayPlan = async (date: string, plan: MealPlan | undefined) => {
    const payload = serializeDayPlan(plan);

    const response = await fetch('/api/meal-plans/day', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, ...payload })
    });

    const result = await response.json();

    if (!response.ok || !result?.success || !result?.data) {
      throw new Error(result?.message || 'Failed to save meal plan day');
    }

    return result.data as MealPlan;
  };

  const copyPreviousDay = async () => {
    if (!selectedDay) return;

    const currentIndex = upcomingDays.findIndex((day) => day.date === selectedDay.date);
    if (currentIndex <= 0) {
      showMessage('No previous day to copy from');
      return;
    }

    const sourceDate = upcomingDays[currentIndex - 1].date;
    const sourcePlan = localMealPlansByDate[sourceDate];
    const targetCurrentPlan = localMealPlansByDate[selectedDay.date];
    const targetHasContent = (targetCurrentPlan?.meals?.length || 0) > 0 || (targetCurrentPlan?.cookingSessions?.length || 0) > 0;
    if (targetHasContent) {
      const confirmed = window.confirm('This will overwrite the currently selected day. Continue?');
      if (!confirmed) return;
    }

    try {
      setBulkSaving(true);
      const snapshot: DaySnapshot = {
        date: selectedDay.date,
        plan: targetCurrentPlan
      };
      const updated = await saveDayPlan(selectedDay.date, sourcePlan);
      setLocalMealPlansByDate((prev) => ({ ...prev, [selectedDay.date]: updated }));
      showUndoMessage('Copied previous day', async () => {
        await restoreSnapshots([snapshot]);
      });
    } catch (error) {
      console.error('Failed to copy previous day:', error);
      alert('Failed to copy previous day.');
    } finally {
      setBulkSaving(false);
    }
  };

  const repeatSelectedDayToEnd = async () => {
    if (!selectedDay) return;

    const sourcePlan = localMealPlansByDate[selectedDay.date];
    const sourcePayload = serializeDayPlan(sourcePlan);
    if (sourcePayload.meals.length === 0 && sourcePayload.cookingSessions.length === 0) {
      showMessage('Selected day is empty');
      return;
    }

    const startIndex = upcomingDays.findIndex((day) => day.date === selectedDay.date);
    const targetDays = upcomingDays.slice(startIndex + 1);
    if (targetDays.length === 0) {
      showMessage('No later days in range');
      return;
    }

    try {
      setBulkSaving(true);
      const nextMap = { ...localMealPlansByDate };
      const snapshots: DaySnapshot[] = targetDays.map((day) => ({
        date: day.date,
        plan: localMealPlansByDate[day.date]
      }));
      const hasAnyExisting = snapshots.some((snapshot) => (
        (snapshot.plan?.meals?.length || 0) > 0 || (snapshot.plan?.cookingSessions?.length || 0) > 0
      ));

      if (hasAnyExisting) {
        const confirmed = window.confirm('This will overwrite some existing days in the range. Continue?');
        if (!confirmed) {
          setBulkSaving(false);
          return;
        }
      }

      for (const day of targetDays) {
        const response = await fetch('/api/meal-plans/day', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: day.date, ...sourcePayload })
        });

        const result = await response.json();
        if (!response.ok || !result?.success || !result?.data) {
          throw new Error(result?.message || `Failed to repeat to ${day.date}`);
        }

        nextMap[day.date] = result.data;
      }

      setLocalMealPlansByDate(nextMap);
      showUndoMessage('Repeated to remaining days', async () => {
        await restoreSnapshots(snapshots);
      });
    } catch (error) {
      console.error('Failed to repeat day:', error);
      alert('Failed to repeat selected day.');
    } finally {
      setBulkSaving(false);
    }
  };

  const renderMealCard = (meal: Meal, index: number, date: string) => {
    const key = `${date}:meal:${index}`;
    return (
      <div key={key} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
            meal.type === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
            meal.type === 'lunch' ? 'bg-blue-900 text-blue-300' :
            meal.type === 'dinner' ? 'bg-purple-900 text-purple-300' :
            'bg-green-900 text-green-300'
          }`}>
            {meal.type}
          </span>
          <span className="px-2 py-1 text-xs rounded bg-gray-900 text-gray-300">
            {meal.source.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm font-semibold text-white">{meal.recipe.title}</p>
        <p className="text-xs text-gray-400">{meal.recipe.prepTime} min • {meal.recipe.macros.calories} cal</p>

        <div className="mt-2 inline-flex items-center gap-2 bg-gray-800 rounded-lg border border-gray-600 px-2 py-1">
          <button
            type="button"
            onClick={() => updateEntryServings(date, 'meal', index, (meal.plannedServings || 1) - 1)}
            disabled={updatingServingsKey === key || (meal.plannedServings || 1) <= 1}
            className="w-8 h-8 sm:w-6 sm:h-6 rounded bg-gray-700 text-gray-200 disabled:opacity-40"
          >
            -
          </button>
          <span className="text-xs text-gray-300 min-w-14 text-center">{meal.plannedServings || 1} planned</span>
          <button
            type="button"
            onClick={() => updateEntryServings(date, 'meal', index, (meal.plannedServings || 1) + 1)}
            disabled={updatingServingsKey === key}
            className="w-8 h-8 sm:w-6 sm:h-6 rounded bg-gray-700 text-gray-200 disabled:opacity-40"
          >
            +
          </button>
          {(updatingServingsKey === key || recentlySavedServingsKey === key) && (
            <span className={`text-[10px] ml-1 ${updatingServingsKey === key ? 'text-yellow-300' : 'text-green-300'}`}>
              {updatingServingsKey === key ? 'Saving...' : 'Saved'}
            </span>
          )}
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => toggleExcludeFromShopping(date, 'meal', index, meal.excludeFromShopping)}
            disabled={updatingShoppingToggleKey === `${key}:shopping`}
            className={`text-xs px-2 py-1 rounded border ${
              meal.excludeFromShopping
                ? 'border-yellow-600 bg-yellow-900/40 text-yellow-200'
                : 'border-gray-600 bg-gray-800 text-gray-300'
            } disabled:opacity-50`}
          >
            {updatingShoppingToggleKey === `${key}:shopping`
              ? 'Saving...'
              : meal.excludeFromShopping
                ? 'Excluded from shopping'
                : 'Include in shopping'}
          </button>
        </div>
      </div>
    );
  };

  const renderSessionCard = (session: CookingSession, index: number, date: string) => {
    const key = `${date}:cooking_session:${index}`;

    return (
      <div key={key} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-900 text-orange-300">
            {session.timeSlot}
          </span>
          <span className="px-2 py-1 text-xs rounded bg-gray-900 text-gray-300">
            {session.purpose.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm font-semibold text-white">Cook: {session.recipe.title}</p>
        <p className="text-xs text-gray-400">{session.recipe.prepTime} min prep</p>

        <div className="mt-2 inline-flex items-center gap-2 bg-gray-800 rounded-lg border border-gray-600 px-2 py-1">
          <button
            type="button"
            onClick={() => updateEntryServings(date, 'cooking_session', index, (session.plannedServings || session.servings || 1) - 1)}
            disabled={updatingServingsKey === key || (session.plannedServings || session.servings || 1) <= 1}
            className="w-8 h-8 sm:w-6 sm:h-6 rounded bg-gray-700 text-gray-200 disabled:opacity-40"
          >
            -
          </button>
          <span className="text-xs text-gray-300 min-w-14 text-center">{session.plannedServings || session.servings || 1} planned</span>
          <button
            type="button"
            onClick={() => updateEntryServings(date, 'cooking_session', index, (session.plannedServings || session.servings || 1) + 1)}
            disabled={updatingServingsKey === key}
            className="w-8 h-8 sm:w-6 sm:h-6 rounded bg-gray-700 text-gray-200 disabled:opacity-40"
          >
            +
          </button>
          {(updatingServingsKey === key || recentlySavedServingsKey === key) && (
            <span className={`text-[10px] ml-1 ${updatingServingsKey === key ? 'text-yellow-300' : 'text-green-300'}`}>
              {updatingServingsKey === key ? 'Saving...' : 'Saved'}
            </span>
          )}
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={() => toggleExcludeFromShopping(date, 'cooking_session', index, session.excludeFromShopping)}
            disabled={updatingShoppingToggleKey === `${key}:shopping`}
            className={`text-xs px-2 py-1 rounded border ${
              session.excludeFromShopping
                ? 'border-yellow-600 bg-yellow-900/40 text-yellow-200'
                : 'border-gray-600 bg-gray-800 text-gray-300'
            } disabled:opacity-50`}
          >
            {updatingShoppingToggleKey === `${key}:shopping`
              ? 'Saving...'
              : session.excludeFromShopping
                ? 'Excluded from shopping'
                : 'Include in shopping'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-center mb-6">
        <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
      </div>

      {viewMode === 'weekly' ? (
        <div className="space-y-6">
          <section className="bg-gray-800/70 rounded-xl border border-gray-700 p-4">
            <p className="text-sm text-white font-medium mb-2">Quick Start</p>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>1) Pick a horizon (7/14/custom) and select a day from the timeline.</li>
              <li>2) Add meals/sessions, adjust servings, and exclude leftovers from shopping.</li>
              <li>3) Use Copy/Repeat actions to plan faster, then generate your shopping list.</li>
            </ul>
          </section>

          <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Planning Horizon</h3>
                <p className="text-xs text-gray-400">Choose your planning window and fill your days quickly.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleHorizonChange(7)}
                  className={`px-3 py-2 text-xs rounded ${searchParams.get('days') !== '14' && !searchParams.get('start') ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                >
                  Next 7 Days
                </button>
                <button
                  onClick={() => handleHorizonChange(14)}
                  className={`px-3 py-2 text-xs rounded ${searchParams.get('days') === '14' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}
                >
                  Next 14 Days
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
              <button
                onClick={applyCustomRange}
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              >
                Apply Custom Range
              </button>
            </div>
          </section>

          <section className="bg-gray-800 rounded-xl border border-gray-700 p-3 sm:p-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {upcomingDays.map((day) => {
                const plan = localMealPlansByDate[day.date];
                const mealsCount = plan?.meals?.length || 0;
                const sessionsCount = plan?.cookingSessions?.length || 0;
                const isSelected = selectedDay?.date === day.date;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`min-w-[140px] text-left rounded-lg border px-3 py-2 transition-colors ${
                      isSelected
                        ? 'bg-green-900/40 border-green-600 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-200'
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {day.isToday ? 'Today' : day.isTomorrow ? 'Tomorrow' : day.dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-xs opacity-80">{day.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p className="text-[11px] mt-1 opacity-80">{mealsCount} meals • {sessionsCount} prep</p>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedDay && (
            <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {selectedDay.isToday ? 'Today' : selectedDay.isTomorrow ? 'Tomorrow' : selectedDay.dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                  </h3>
                  <p className="text-sm text-gray-400">{selectedDay.formatted}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-3 py-2 text-xs rounded bg-green-600 hover:bg-green-500 text-white"
                  >
                    Add Meal/Session
                  </button>
                  <button
                    onClick={copyPreviousDay}
                    disabled={bulkSaving}
                    className="px-3 py-2 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50"
                  >
                    Copy Previous Day
                  </button>
                  <button
                    onClick={repeatSelectedDayToEnd}
                    disabled={bulkSaving}
                    className="px-3 py-2 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50"
                  >
                    Repeat to End
                  </button>
                </div>
              </div>

              {actionMessage && (
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-xs text-green-300">{actionMessage}</p>
                  {actionUndo && (
                    <button
                      type="button"
                      onClick={async () => {
                        const callback = actionUndo;
                        setActionUndo(null);
                        if (callback) await callback();
                      }}
                      className="px-2 py-1 text-[10px] rounded bg-green-800 hover:bg-green-700 text-white"
                    >
                      Undo
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-base font-semibold text-white mb-3">Meals</h4>
                  {selectedDayPlan?.meals?.length ? (
                    <div className="space-y-2">
                      {selectedDayPlan.meals.map((meal, index) => renderMealCard(meal, index, selectedDay.date))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 bg-gray-700/50 rounded-lg border border-gray-700 p-3">No meals planned for this day.</div>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-semibold text-white mb-3">Cooking Sessions</h4>
                  {selectedDayPlan?.cookingSessions?.length ? (
                    <div className="space-y-2">
                      {selectedDayPlan.cookingSessions.map((session, index) => renderSessionCard(session, index, selectedDay.date))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 bg-gray-700/50 rounded-lg border border-gray-700 p-3">No cooking sessions planned for this day.</div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      ) : (
        <MonthlyCalendar
          monthlyDays={monthlyDays}
          mealPlansByDate={localMealPlansByDate}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          onDayClick={(date) => {
            setSelectedDate(date);
            setIsModalOpen(true);
          }}
        />
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center text-xl sm:text-2xl font-light z-50"
        aria-label="Add meal or cooking session"
      >
        +
      </button>

      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        upcomingDays={upcomingDays}
        initialSelectedDate={selectedDate}
      />
    </>
  );
}
