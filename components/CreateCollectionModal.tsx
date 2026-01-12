'use client';

import { useState } from 'react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (collectionData: { name: string; description: string; color: string }) => Promise<void>;
}

const COLLECTION_COLORS = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

export default function CreateCollectionModal({ isOpen, onClose, onSubmit }: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🟡 Modal handleSubmit called');
    e.preventDefault();

    if (!name.trim()) {
      console.log('🔴 Validation failed: Collection name is required');
      setError('Collection name is required');
      return;
    }

    if (name.trim().length > 50) {
      console.log('🔴 Validation failed: Collection name too long');
      setError('Collection name must be 50 characters or less');
      return;
    }

    if (description.trim().length > 200) {
      console.log('🔴 Validation failed: Description too long');
      setError('Description must be 200 characters or less');
      return;
    }

    console.log('🟢 All validations passed, proceeding with submission');
    setIsSubmitting(true);
    setError('');

    const collectionData = {
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
    };

    console.log('🟡 About to call onSubmit with data:', collectionData);

    try {
      await onSubmit(collectionData);

      console.log('🟢 onSubmit completed successfully, resetting form');
      // Reset form only on success
      setName('');
      setDescription('');
      setSelectedColor(COLLECTION_COLORS[0]);
      setError('');
    } catch (err) {
      console.error('🔴 Error caught in modal handleSubmit:', err);
      console.error('🔴 Error type:', err?.constructor?.name);
      console.error('🔴 Error message:', err?.message);
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      console.log('🟡 Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setSelectedColor(COLLECTION_COLORS[0]);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Create New Collection</h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white transition-colors p-1 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-600 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Collection Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Chicken Recipes, Quick Dinners"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength={50}
                required
                disabled={isSubmitting}
              />
              <div className="text-xs text-gray-400 mt-1">
                {name.length}/50 characters
              </div>
            </div>

            {/* Collection Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what recipes you'll organize in this collection..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                maxLength={200}
                disabled={isSubmitting}
              />
              <div className="text-xs text-gray-400 mt-1">
                {description.length}/200 characters
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Collection Color
              </label>
              <div className="grid grid-cols-5 gap-3">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    disabled={isSubmitting}
                    className={`w-10 h-10 rounded-full border-2 transition-all disabled:opacity-50 ${
                      selectedColor === color
                        ? 'border-white scale-110'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Select ${color} color`}
                  >
                    {selectedColor === color && (
                      <span className="text-white text-lg">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}