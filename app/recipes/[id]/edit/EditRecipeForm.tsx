'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl: string;
  userId: string | null;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecipeFormData {
  title: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl: string;
}

interface EditRecipeFormProps {
  recipe: Recipe;
}

export default function EditRecipeForm({ recipe }: EditRecipeFormProps) {
  const router = useRouter();

  // Initialize form with recipe data
  const [formData, setFormData] = useState<RecipeFormData>({
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    prepTime: recipe.prepTime,
    ingredients: [...recipe.ingredients],
    instructions: [...recipe.instructions],
    macros: { ...recipe.macros },
    imageUrl: recipe.imageUrl,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMacroChange = (macro: keyof typeof formData.macros, value: number) => {
    setFormData(prev => ({
      ...prev,
      macros: {
        ...prev.macros,
        [macro]: value
      }
    }));
  };

  const addArrayItem = (field: 'ingredients' | 'instructions') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (field: 'ingredients' | 'instructions', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayItem = (field: 'ingredients' | 'instructions', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Filter out empty ingredients and instructions
      const cleanFormData = {
        ...formData,
        ingredients: formData.ingredients.filter(item => item.trim() !== ''),
        instructions: formData.instructions.filter(item => item.trim() !== '')
      };

      // Validate
      if (!cleanFormData.title || !cleanFormData.description ||
          cleanFormData.ingredients.length === 0 || cleanFormData.instructions.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch(`/api/recipes/${recipe._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanFormData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update recipe');
      }

      // Navigate back to recipe detail page
      router.push(`/recipe/${recipe._id}`);
    } catch (err) {
      console.error('Error updating recipe:', err);
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipe Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
            placeholder="Enter recipe title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
            required
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
          placeholder="Describe your recipe"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Prep Time (minutes) *
        </label>
        <input
          type="number"
          value={formData.prepTime}
          onChange={(e) => handleInputChange('prepTime', parseInt(e.target.value) || 0)}
          className="w-full max-w-xs px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
          min="1"
          required
        />
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Ingredients *
        </label>
        {formData.ingredients.map((ingredient, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={ingredient}
              onChange={(e) => updateArrayItem('ingredients', index, e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
              placeholder={`Ingredient ${index + 1}`}
            />
            {formData.ingredients.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem('ingredients', index)}
                className="text-red-400 hover:text-red-300 px-2 py-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('ingredients')}
          className="text-green-400 hover:text-green-300 text-sm"
        >
          + Add Ingredient
        </button>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Instructions *
        </label>
        {formData.instructions.map((instruction, index) => (
          <div key={index} className="flex items-start space-x-2 mb-2">
            <span className="text-gray-400 text-sm mt-3">{index + 1}.</span>
            <textarea
              value={instruction}
              onChange={(e) => updateArrayItem('instructions', index, e.target.value)}
              rows={2}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
              placeholder={`Step ${index + 1}`}
            />
            {formData.instructions.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem('instructions', index)}
                className="text-red-400 hover:text-red-300 px-2 py-1 mt-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('instructions')}
          className="text-green-400 hover:text-green-300 text-sm"
        >
          + Add Step
        </button>
      </div>

      {/* Nutritional Information */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Nutritional Information (per serving) *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Calories</label>
            <input
              type="number"
              value={formData.macros.calories}
              onChange={(e) => handleMacroChange('calories', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Protein (g)</label>
            <input
              type="number"
              value={formData.macros.protein}
              onChange={(e) => handleMacroChange('protein', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Carbs (g)</label>
            <input
              type="number"
              value={formData.macros.carbs}
              onChange={(e) => handleMacroChange('carbs', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Fat (g)</label>
            <input
              type="number"
              value={formData.macros.fat}
              onChange={(e) => handleMacroChange('fat', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
              min="0"
              required
            />
          </div>
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Image URL (optional)
        </label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => handleInputChange('imageUrl', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-green-500 focus:border-green-500"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-gray-400 mt-1">
          Leave empty to use default placeholder image
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
        <button
          type="button"
          onClick={() => router.push(`/recipe/${recipe._id}`)}
          className="px-6 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Updating...' : 'Update Recipe'}
        </button>
      </div>
    </form>
  );
}