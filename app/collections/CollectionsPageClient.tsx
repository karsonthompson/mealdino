'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CreateCollectionModal from '../../components/CreateCollectionModal';

interface Collection {
  _id: string;
  name: string;
  description: string;
  color: string;
  isDefault: boolean;
  recipeCount: number;
  recipes: Array<{
    _id: string;
    title: string;
    imageUrl: string;
    category: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function CollectionsPageClient() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();

      if (data.success) {
        setCollections(data.data);
      } else {
        console.error('Failed to fetch collections:', data.message);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (collectionData: { name: string; description: string; color: string }) => {
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh collections list
        await fetchCollections();
        setShowCreateModal(false);
      } else {
        throw new Error(data.message || 'Failed to create collection');
      }
    } catch (error) {
      // Re-throw the error so the modal can handle it
      throw error instanceof Error ? error : new Error('Failed to create collection');
    }
  };

  const handleDeleteCollection = async (collectionId: string, collectionName: string) => {
    if (!confirm(`Are you sure you want to delete "${collectionName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh collections list
        await fetchCollections();
      } else {
        console.error('Failed to delete collection:', data.message);
        alert('Failed to delete collection: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📂</div>
          <p className="text-lg">Loading your collections...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 text-base"
        >
          <span>+</span>
          <span>Create New Collection</span>
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-center">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-xl text-gray-300 mb-4">No collections yet</p>
            <p className="text-gray-400 mb-6">
              Create your first collection to organize your favorite recipes.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Collection
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div
              key={collection._id}
              className="bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                {/* Collection Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: collection.color }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{collection.name}</h3>
                      {collection.description && (
                        <p className="text-sm text-gray-400 mt-1">{collection.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Delete button for non-default collections */}
                  {!collection.isDefault && (
                    <button
                      onClick={() => handleDeleteCollection(collection._id, collection.name)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      title="Delete collection"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Recipe Count */}
                <div className="mb-4">
                  <span className="text-sm text-gray-400">
                    {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
                  </span>
                </div>

                {/* Recipe Previews */}
                {collection.recipes.length > 0 && (
                  <div className="mb-4">
                    <div className="flex -space-x-2 overflow-hidden">
                      {collection.recipes.slice(0, 3).map((recipe, index) => (
                        <div
                          key={recipe._id}
                          className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs font-medium text-white"
                          title={recipe.title}
                        >
                          {recipe.title.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {collection.recipeCount > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs font-medium text-gray-300">
                          +{collection.recipeCount - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    href={`/collections/${collection._id}`}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors font-medium text-center text-sm"
                  >
                    View Collection
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCollection}
      />
    </>
  );
}