import dbConnect from './mongodb';
import MealPlan from '@/models/MealPlan';
import Recipe from '@/models/Recipe';

// Get meal plans for a date range (e.g., a week) for a specific user
export async function getMealPlansByDateRange(startDate, endDate, userId) {
  try {
    await dbConnect();

    // Find all meal plans within the date range for this user
    const mealPlans = await MealPlan.find({
      userId,
      date: {
        $gte: startDate, // Greater than or equal to start date
        $lte: endDate    // Less than or equal to end date
      }
    })
    .populate('meals.recipe', 'title category prepTime macros') // Get recipe details
    .populate('cookingSessions.recipe', 'title category prepTime')
    .sort({ date: 1 }); // Sort by date ascending

    // Convert MongoDB documents to plain objects
    return mealPlans.map(plan => ({
      _id: plan._id.toString(),
      date: plan.date,
      meals: plan.meals.map(meal => ({
        type: meal.type,
        recipe: {
          _id: meal.recipe._id.toString(),
          title: meal.recipe.title,
          category: meal.recipe.category,
          prepTime: meal.recipe.prepTime,
          macros: meal.recipe.macros
        },
        notes: meal.notes,
        source: meal.source
      })),
      cookingSessions: plan.cookingSessions.map(session => ({
        recipe: {
          _id: session.recipe._id.toString(),
          title: session.recipe.title,
          category: session.recipe.category,
          prepTime: session.recipe.prepTime
        },
        notes: session.notes,
        timeSlot: session.timeSlot,
        servings: session.servings,
        purpose: session.purpose
      })),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching meal plans by date range:', error);
    return [];
  }
}

// Get meal plan for a specific date for a specific user
export async function getMealPlanByDate(date, userId) {
  try {
    await dbConnect();

    const mealPlan = await MealPlan.findOne({ userId, date })
      .populate('meals.recipe', 'title category prepTime macros')
      .populate('cookingSessions.recipe', 'title category prepTime');

    if (!mealPlan) {
      return null;
    }

    // Convert to plain object
    return {
      _id: mealPlan._id.toString(),
      date: mealPlan.date,
      meals: mealPlan.meals.map(meal => ({
        type: meal.type,
        recipe: {
          _id: meal.recipe._id.toString(),
          title: meal.recipe.title,
          category: meal.recipe.category,
          prepTime: meal.recipe.prepTime,
          macros: meal.recipe.macros
        },
        notes: meal.notes,
        source: meal.source
      })),
      cookingSessions: mealPlan.cookingSessions.map(session => ({
        recipe: {
          _id: session.recipe._id.toString(),
          title: session.recipe.title,
          category: session.recipe.category,
          prepTime: session.recipe.prepTime
        },
        notes: session.notes,
        timeSlot: session.timeSlot,
        servings: session.servings,
        purpose: session.purpose
      })),
      createdAt: mealPlan.createdAt.toISOString(),
      updatedAt: mealPlan.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error fetching meal plan by date:', error);
    return null;
  }
}

// Save or update a meal plan for a specific date for a specific user
export async function saveMealPlan(date, userId, meals = [], cookingSessions = []) {
  try {
    await dbConnect();

    // Find existing meal plan or create new one
    let mealPlan = await MealPlan.findOne({ userId, date });

    if (mealPlan) {
      // Update existing meal plan
      mealPlan.meals = meals;
      mealPlan.cookingSessions = cookingSessions;
      await mealPlan.save();
    } else {
      // Create new meal plan
      mealPlan = new MealPlan({
        userId,
        date,
        meals,
        cookingSessions
      });
      await mealPlan.save();
    }

    // Return the saved meal plan with populated recipes
    const populatedPlan = await MealPlan.findById(mealPlan._id)
      .populate('meals.recipe', 'title category prepTime macros')
      .populate('cookingSessions.recipe', 'title category prepTime');

    return {
      _id: populatedPlan._id.toString(),
      date: populatedPlan.date,
      meals: populatedPlan.meals.map(meal => ({
        type: meal.type,
        recipe: {
          _id: meal.recipe._id.toString(),
          title: meal.recipe.title,
          category: meal.recipe.category,
          prepTime: meal.recipe.prepTime,
          macros: meal.recipe.macros
        },
        notes: meal.notes,
        source: meal.source
      })),
      cookingSessions: populatedPlan.cookingSessions.map(session => ({
        recipe: {
          _id: session.recipe._id.toString(),
          title: session.recipe.title,
          category: session.recipe.category,
          prepTime: session.recipe.prepTime
        },
        notes: session.notes,
        timeSlot: session.timeSlot,
        servings: session.servings,
        purpose: session.purpose
      })),
      createdAt: populatedPlan.createdAt.toISOString(),
      updatedAt: populatedPlan.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw error;
  }
}

// Add a meal to a specific date for a specific user
export async function addMealToPlan(date, userId, mealData) {
  try {
    await dbConnect();

    let mealPlan = await MealPlan.findOne({ userId, date });

    if (!mealPlan) {
      // Create new meal plan if none exists
      mealPlan = new MealPlan({
        userId,
        date,
        meals: [mealData],
        cookingSessions: []
      });
    } else {
      // Add meal to existing plan
      mealPlan.meals.push(mealData);
    }

    await mealPlan.save();
    return await getMealPlanByDate(date, userId); // Return updated plan
  } catch (error) {
    console.error('Error adding meal to plan:', error);
    throw error;
  }
}

// Add a cooking session to a specific date for a specific user
export async function addCookingSessionToPlan(date, userId, sessionData) {
  try {
    await dbConnect();

    let mealPlan = await MealPlan.findOne({ userId, date });

    if (!mealPlan) {
      // Create new meal plan if none exists
      mealPlan = new MealPlan({
        userId,
        date,
        meals: [],
        cookingSessions: [sessionData]
      });
    } else {
      // Add cooking session to existing plan
      mealPlan.cookingSessions.push(sessionData);
    }

    await mealPlan.save();
    return await getMealPlanByDate(date, userId); // Return updated plan
  } catch (error) {
    console.error('Error adding cooking session to plan:', error);
    throw error;
  }
}

// Delete entire meal plan for a date for a specific user
export async function deleteMealPlan(date, userId) {
  try {
    await dbConnect();
    await MealPlan.findOneAndDelete({ userId, date });
    return true;
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return false;
  }
}

// Helper function to format date as YYYY-MM-DD
export function formatDateForDB(date) {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date; // Assume it's already in the right format
}

// Helper function to get date range for current week
export function getCurrentWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate start of week (Monday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

  // Calculate end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return {
    startDate: formatDateForDB(startOfWeek),
    endDate: formatDateForDB(endOfWeek)
  };
}

// Helper function to get date range for current month
export function getCurrentMonthRange() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);

  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);

  return {
    startDate: formatDateForDB(firstDay),
    endDate: formatDateForDB(lastDay)
  };
}

// Helper function to get date range for a specific month
export function getMonthRange(year, month) {
  // First day of the month
  const firstDay = new Date(year, month, 1);

  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);

  return {
    startDate: formatDateForDB(firstDay),
    endDate: formatDateForDB(lastDay)
  };
}

// Helper function to generate monthly calendar days with padding
export function getMonthlyDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDay.getDay();

  // Calculate padding days from previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  const days = [];

  // Add padding days from previous month (Monday = 1, so we adjust)
  const paddingStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  for (let i = paddingStart; i > 0; i--) {
    const paddingDate = new Date(prevYear, prevMonth, daysInPrevMonth - i + 1);
    days.push({
      date: formatDateForDB(paddingDate),
      dateObj: paddingDate,
      dayNumber: paddingDate.getDate(),
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false,
      isToday: false,
      formatted: paddingDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
  }

  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();

    days.push({
      date: formatDateForDB(currentDate),
      dateObj: currentDate,
      dayNumber: day,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false,
      isToday,
      formatted: currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
  }

  // Add padding days from next month to complete the grid (42 days = 6 weeks)
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const remainingDays = 42 - days.length;

  for (let day = 1; day <= remainingDays; day++) {
    const paddingDate = new Date(nextYear, nextMonth, day);
    days.push({
      date: formatDateForDB(paddingDate),
      dateObj: paddingDate,
      dayNumber: day,
      isCurrentMonth: false,
      isPrevMonth: false,
      isNextMonth: true,
      isToday: false,
      formatted: paddingDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
  }

  return days;
}