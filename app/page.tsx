export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-green-600">MealDino</h1>
              <span className="ml-2 text-lg text-gray-600">🦕</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-green-600 font-medium">Recipes</a>
              <a href="#" className="text-gray-600 hover:text-green-600 font-medium">My Favorites</a>
              <a href="#" className="text-gray-600 hover:text-green-600 font-medium">Meal Planner</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Healthy Eating,
            <span className="text-green-600"> Simplified</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stop overthinking what to eat. Discover clean, healthy recipes with ingredients you can trust.
            Just click, cook, and enjoy.
          </p>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-900">Today&apos;s Recipes</h3>
            <div className="flex space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-full hover:bg-green-100 transition-colors">
                All
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                Breakfast
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                Lunch
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                Dinner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="h-48 bg-gradient-to-r from-green-100 to-blue-100 rounded-t-xl flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">🍽️</div>
                    <p className="text-sm">Recipe Image</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Placeholder
                    </span>
                    <span className="text-sm text-gray-500">30 min</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Recipe Title Placeholder</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    This is where the recipe description will go. Clean ingredients, simple steps.
                  </p>
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
                    Cook This Recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
