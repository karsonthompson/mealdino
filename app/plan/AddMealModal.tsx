'use client';

import { useState, useEffect } from 'react';

interface UpcomingDay {
  date: string;
  dateObj: Date;
  formatted: string;
  shortFormatted: string;
  isToday: boolean;
  isTomorrow: boolean;
}

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  upcomingDays: UpcomingDay[];
}

interface Recipe {
  _id: string;
  title: string;
  category: string;
  prepTime: number;
  recipeServings: number;
  userId: string | null;
  isGlobal: boolean;
  macros: {
    calories: number;
  };
}

export default function AddMealModal({ isOpen, onClose, upcomingDays }: AddMealModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [planType, setPlanType] = useState<'meal' | 'cooking_session'>('meal');
  const [selectedDate, setSelectedDate] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [mealSource, setMealSource] = useState('fresh');
  const [timeSlot, setTimeSlot] = useState('afternoon');
  const [plannedServings, setPlannedServings] = useState(1);
  const [purpose, setPurpose] = useState('daily_cooking');
  const [notes, setNotes] = useState('');

  // Load recipes when modal opens
  useEffect(() => {
    if (isOpen && recipes.length === 0) {
      loadRecipes();
    }

    // Set default date to today when modal opens
    if (isOpen && upcomingDays.length > 0) {
      setSelectedDate(upcomingDays[0].date);
    }
  }, [isOpen, upcomingDays, recipes.length]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recipes');
      const data = await response.json();
      if (data.success) {
        setRecipes(data.data);
        if (data.data.length > 0) {
          setSelectedRecipe(data.data[0]._id);
          setPlannedServings(data.data[0].recipeServings || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedRecipe(recipes.length > 0 ? recipes[0]._id : '');
    setPlanType('meal');
    setSelectedDate(upcomingDays.length > 0 ? upcomingDays[0].date : '');
    setMealType('lunch');
    setMealSource('fresh');
    setTimeSlot('afternoon');
    const selected = recipes.find((recipe) => recipe._id === selectedRecipe);
    setPlannedServings(selected?.recipeServings || recipes[0]?.recipeServings || 1);
    setPurpose('daily_cooking');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        date: selectedDate,
        type: planType,
        recipe_id: selectedRecipe,
        notes,
        // Add type-specific fields
        ...(planType === 'meal' ? {
          meal_type: mealType,
          source: mealSource,
          planned_servings: plannedServings
        } : {
          time_slot: timeSlot,
          planned_servings: plannedServings,
          purpose
        })
      };

      const response = await fetch('/api/meal-plans/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Success - close modal and refresh page
        onClose();
        resetForm();
        window.location.reload(); // Simple refresh for now
      } else {
        // Show error to user
        console.error('Failed to add meal plan item:', responseData);
        alert(`Failed to add meal: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting meal plan:', error);
      alert('An error occurred while adding the meal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const selectedRecipeData = recipes.find(r => r._id === selectedRecipe);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Add to Plan</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors text-lg sm:text-xl"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Recipe Selection */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Recipe</label>
              {loading ? (
                <div className="text-gray-400 text-sm sm:text-base">Loading recipes...</div>
              ) : (
                <>
                  <select
                    value={selectedRecipe}
                    onChange={(e) => {
                      const nextRecipeId = e.target.value;
                      setSelectedRecipe(nextRecipeId);
                      const nextRecipe = recipes.find((recipe) => recipe._id === nextRecipeId);
                      if (nextRecipe) {
                        setPlannedServings(nextRecipe.recipeServings || 1);
                      }
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {recipes.map((recipe: Recipe) => (
                      <option key={recipe._id} value={recipe._id}>
                        {recipe.title} {recipe.isGlobal ? '[Global]' : '[Your Recipe]'} ({recipe.prepTime}min, {recipe.macros.calories} cal)
                      </option>
                    ))}
                  </select>
                  {selectedRecipeData && (
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                      <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${selectedRecipeData.isGlobal ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                      {selectedRecipeData.isGlobal ? 'Global Recipe' : 'Your Recipe'}
                      </span>
                      {selectedRecipeData.category} • {selectedRecipeData.prepTime} min • {selectedRecipeData.macros.calories} cal • serves {selectedRecipeData.recipeServings || 1}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Plan Type Toggle */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="meal"
                    checked={planType === 'meal'}
                    onChange={(e) => setPlanType(e.target.value as 'meal')}
                    className="mr-2 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-gray-300 text-sm sm:text-base">Meal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cooking_session"
                    checked={planType === 'cooking_session'}
                    onChange={(e) => setPlanType(e.target.value as 'cooking_session')}
                    className="mr-2 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-gray-300 text-sm sm:text-base">Cooking Session</span>
                </label>
              </div>
            </div>

            {/* Date Grid */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Date</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {upcomingDays.slice(0, 6).map((day: UpcomingDay) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-colors ${
                      selectedDate === day.date
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium text-xs sm:text-sm">
                      {day.isToday ? 'Today' : day.isTomorrow ? 'Tomorrow' : day.dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs">
                      {day.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Fields */}
            {planType === 'meal' ? (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Meal Type</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Source</label>
                  <select
                    value={mealSource}
                    onChange={(e) => setMealSource(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="fresh">Fresh</option>
                    <option value="meal_prep">Meal Prep</option>
                    <option value="leftovers">Leftovers</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Planned Servings</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={plannedServings}
                    onChange={(e) => setPlannedServings(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Planned Servings</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={plannedServings}
                    onChange={(e) => setPlannedServings(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="daily_cooking">Daily Cooking</option>
                    <option value="meal_prep">Meal Prep</option>
                    <option value="batch_cooking">Batch Cooking</option>
                    <option value="weekly_prep">Weekly Prep</option>
                  </select>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes or reminders..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={200}
              />
              <p className="text-gray-500 text-xs mt-1">{notes.length}/200</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedRecipe}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {submitting ? 'Adding...' : 'Add to Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
