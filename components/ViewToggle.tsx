'use client';

interface ViewToggleProps {
  currentView: 'weekly' | 'monthly';
  onViewChange: (view: 'weekly' | 'monthly') => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
      <button
        onClick={() => onViewChange('weekly')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          currentView === 'weekly'
            ? 'bg-green-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
        }`}
      >
        Weekly
      </button>
      <button
        onClick={() => onViewChange('monthly')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          currentView === 'monthly'
            ? 'bg-green-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
        }`}
      >
        Monthly
      </button>
    </div>
  );
}