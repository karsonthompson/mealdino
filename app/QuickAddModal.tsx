'use client';

import { useState, useEffect } from 'react';

interface Recipe {
  _id: string;
  title: string;
  category: string;
  prepTime: number;
  macros: {
    calories: number;
  };
}

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

// Helper function to get the next few days
function getUpcomingDays(numDays = 7) {
  const days = [];
  const today = new Date();

  for (let i = 0; i < numDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    days.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      dateObj: date,
      isToday: i === 0,
      isTomorrow: i === 1
    });
  }

  return days;
}

export default function QuickAddModal({ isOpen, onClose, recipe }: QuickAddModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [upcomingDays] = useState(getUpcomingDays(6)); // Show 6 days

  // Form state
  const [planType, setPlanType] = useState<'meal' | 'cooking_session'>('meal');
  const [selectedDate, setSelectedDate] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [mealSource, setMealSource] = useState('fresh');
  const [timeSlot, setTimeSlot] = useState('afternoon');
  const [servings, setServings] = useState(4);
  const [purpose, setPurpose] = useState('daily_cooking');
  const [notes, setNotes] = useState('');

  // Set default date to today when modal opens
  useEffect(() => {
    if (isOpen && upcomingDays.length > 0) {
      setSelectedDate(upcomingDays[0].date);
    }
  }, [isOpen, upcomingDays]);

  // Smart defaults based on recipe category
  useEffect(() => {
    if (recipe && isOpen) {
      // Set smart default meal type based on recipe category
      if (recipe.category === 'breakfast') {
        setMealType('breakfast');
      } else if (recipe.category === 'lunch') {
        setMealType('lunch');
      } else if (recipe.category === 'dinner') {
        setMealType('dinner');
      } else if (recipe.category === 'snack') {
        setMealType('snack');
      } else {
        setMealType('lunch'); // Default fallback
      }
    }
  }, [recipe, isOpen]);

  const resetForm = () => {
    setPlanType('meal');
    setSelectedDate(upcomingDays.length > 0 ? upcomingDays[0].date : '');
    setMealType('lunch');
    setMealSource('fresh');
    setTimeSlot('afternoon');
    setServings(4);
    setPurpose('daily_cooking');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe) return;

    setSubmitting(true);

    try {
      const payload = {
        date: selectedDate,
        type: planType,
        recipe_id: recipe._id,
        notes,
        // Add type-specific fields
        ...(planType === 'meal' ? {
          meal_type: mealType,
          source: mealSource
        } : {
          time_slot: timeSlot,
          servings,
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

      if (response.ok) {
        // Success - close modal and reset
        onClose();
        resetForm();

        // Show success feedback (optional)
        const successMessage = planType === 'meal'
          ? `${recipe.title} scheduled for ${mealType}!`
          : `${recipe.title} added to cooking session!`;

        // Simple alert for now - could be replaced with toast notification
        alert(successMessage);
      } else {
        alert('Failed to add to meal plan. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting meal plan:', error);
      alert('An error occurred. Please try again.');
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Quick Add</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors text-lg sm:text-xl"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Recipe Info */}
          <div className="bg-gray-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full capitalize ${
                recipe.category === 'breakfast' ? 'bg-yellow-900 text-yellow-300' :
                recipe.category === 'lunch' ? 'bg-blue-900 text-blue-300' :
                recipe.category === 'dinner' ? 'bg-purple-900 text-purple-300' :
                'bg-green-900 text-green-300'
              }`}>
                {recipe.category}
              </span>
            </div>
            <h3 className="font-semibold text-white text-base sm:text-lg">{recipe.title}</h3>
            <p className="text-gray-400 text-xs sm:text-sm">{recipe.prepTime} min • {recipe.macros.calories} cal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Plan Type Toggle */}
            <div>
              <label className="block text-white font-medium mb-2">Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="meal"
                    checked={planType === 'meal'}
                    onChange={(e) => setPlanType(e.target.value as 'meal')}
                    className="mr-2 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-gray-300">Meal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cooking_session"
                    checked={planType === 'cooking_session'}
                    onChange={(e) => setPlanType(e.target.value as 'cooking_session')}
                    className="mr-2 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-gray-300">Cooking Session</span>
                </label>
              </div>
            </div>

            {/* Date Grid */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Date</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {upcomingDays.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`p-2 rounded-lg text-xs sm:text-sm transition-colors ${
                      selectedDate === day.date
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium text-xs">
                      {day.isToday ? 'Today' : day.isTomorrow ? 'Tomorrow' : day.dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs">
                      {day.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Quick Options */}
            {planType === 'meal' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Meal Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMealType(type)}
                        className={`p-2 text-xs sm:text-sm rounded-lg transition-colors capitalize ${
                          mealType === type
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
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
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Time & Servings</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-2 sm:px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={servings}
                      onChange={(e) => setServings(parseInt(e.target.value))}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-2 sm:px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Servings"
                    />
                  </div>
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

            {/* Notes (Compact) */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Quick note..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={200}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
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