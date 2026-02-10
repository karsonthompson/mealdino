'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface ShoppingItem {
  key: string;
  name: string;
  normalizedName?: string;
  unit: string | null;
  quantity: number;
  occurrences: number;
  aisle?: string;
  sources: string[];
}

interface ShoppingReviewItem {
  key: string;
  name: string;
  normalizedName?: string;
  occurrences: number;
  aisle?: string;
  sources: string[];
}

interface ManualShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  aisle: string;
}

interface ShoppingData {
  dateRange: {
    start: string;
    end: string;
  };
  source?: 'plan' | 'recipes' | 'collection';
  selectedRecipeCount?: number;
  selectedCollectionId?: string | null;
  selectedCollectionName?: string | null;
  selectedCollectionRecipeCount?: number;
  includeMeals: boolean;
  includeCookingSessions: boolean;
  mealPlanCount: number;
  checkedKeys: string[];
  manualItems: ManualShoppingItem[];
  totals: ShoppingItem[];
  needsReview: ShoppingReviewItem[];
  stats: {
    plannedMeals: number;
    cookingSessions: number;
    recipesConsidered: number;
    totalIngredientLines: number;
    totalPlannedServings: number;
    totalAggregatedItems: number;
  };
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: ShoppingData;
}

interface ShoppingPageClientProps {
  defaultStartDate: string;
  defaultEndDate: string;
  sourceMode: 'plan' | 'recipes' | 'collection';
  selectedRecipes: Array<{ recipeId: string; plannedServings: number }>;
  selectedCollectionId: string;
}

const TOTAL_KEY_PREFIX = 'total:';
const REVIEW_KEY_PREFIX = 'review:';
const AISLE_ORDER = ['Produce', 'Protein', 'Dairy & Eggs', 'Grains & Bread', 'Pantry', 'Frozen', 'Snacks', 'Beverages', 'Other'];

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayQuantity(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

function getChecklistKey(type: 'total' | 'review', key: string): string {
  return `${type === 'total' ? TOTAL_KEY_PREFIX : REVIEW_KEY_PREFIX}${key}`;
}

function getManualChecklistKey(id: string): string {
  return `manual:${id}`;
}

export default function ShoppingPageClient({
  defaultStartDate,
  defaultEndDate,
  sourceMode,
  selectedRecipes,
  selectedCollectionId
}: ShoppingPageClientProps) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [includeMeals, setIncludeMeals] = useState(true);
  const [includeCookingSessions, setIncludeCookingSessions] = useState(true);

  const [loading, setLoading] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shoppingData, setShoppingData] = useState<ShoppingData | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [manualItems, setManualItems] = useState<ManualShoppingItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastActionLabel, setToastActionLabel] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<(() => void) | null>(null);

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const isRecipeMode = sourceMode === 'recipes';
  const isCollectionMode = sourceMode === 'collection';
  const selectedRecipesPayload = useMemo(() => JSON.stringify(selectedRecipes || []), [selectedRecipes]);
  const isDateRangeValid = useMemo(() => isRecipeMode || startDate <= endDate, [isRecipeMode, startDate, endDate]);

  const showToast = (message: string, options?: { actionLabel?: string; action?: () => void; durationMs?: number }) => {
    setToastMessage(message);
    setToastActionLabel(options?.actionLabel || null);
    setToastAction(() => options?.action || null);
    setTimeout(() => {
      setToastMessage(null);
      setToastActionLabel(null);
      setToastAction(null);
    }, options?.durationMs || 1800);
  };

  const applyPreset = (days: number) => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + (days - 1));

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

  const buildRequestParams = () => {
    const params = new URLSearchParams();

    if (isRecipeMode) {
      params.set('source', 'recipes');
      params.set('selectedRecipes', selectedRecipesPayload);
      return params;
    }

    if (isCollectionMode) {
      params.set('source', 'collection');
      params.set('collectionId', selectedCollectionId);
    }

    params.set('start', startDate);
    params.set('end', endDate);
    params.set('includeMeals', String(includeMeals));
    params.set('includeCookingSessions', String(includeCookingSessions));
    return params;
  };

  const buildChecklistUrl = () => {
    const params = buildRequestParams();
    return `/api/shopping-checklist?${params.toString()}`;
  };

  const saveChecklist = async (nextCheckedKeys: string[], nextManualItems: ManualShoppingItem[] = manualItems) => {
    setSavingChecklist(true);
    try {
      const response = await fetch(buildChecklistUrl(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checkedKeys: nextCheckedKeys, manualItems: nextManualItems })
      });

      if (!response.ok) {
        throw new Error('Failed to save checklist state');
      }
    } catch (err) {
      console.error('Failed to save checklist:', err);
      setError('Failed to save checklist state. Please try again.');
    } finally {
      setSavingChecklist(false);
    }
  };

  const loadShoppingList = async () => {
    if (!isRecipeMode && !isDateRangeValid) {
      setError('Start date must be on or before end date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRecipeMode && selectedRecipes.length === 0) {
        throw new Error('Pick at least one recipe first.');
      }
      if (isCollectionMode && !selectedCollectionId) {
        throw new Error('Select a collection first.');
      }

      const params = buildRequestParams();

      const response = await fetch(`/api/shopping-list?${params.toString()}`);
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.message || 'Failed to build shopping list');
      }

      setShoppingData(data.data);
      setCheckedKeys(data.data.checkedKeys || []);
      setManualItems(data.data.manualItems || []);
    } catch (err) {
      console.error('Failed to load shopping list:', err);
      setError(err instanceof Error ? err.message : 'Failed to build shopping list');
    } finally {
      setLoading(false);
    }
  };

  const toggleChecked = async (key: string) => {
    const nextChecked = checkedKeys.includes(key)
      ? checkedKeys.filter((entry) => entry !== key)
      : [...checkedKeys, key];

    setCheckedKeys(nextChecked);
    await saveChecklist(nextChecked);
  };

  const setAllChecked = async (value: boolean) => {
    if (!shoppingData) return;

    if (!value) {
      setCheckedKeys([]);
      await saveChecklist([]);
      return;
    }

    const allKeys = [
      ...shoppingData.totals.map((item) => getChecklistKey('total', item.key)),
      ...shoppingData.needsReview.map((item) => getChecklistKey('review', item.key)),
      ...manualItems.map((item) => getManualChecklistKey(item.id))
    ];

    setCheckedKeys(allKeys);
    await saveChecklist(allKeys);
  };

  const buildExportText = () => {
    if (!shoppingData) return '';

    const lines: string[] = [];

    if (isRecipeMode) {
      lines.push('MealDino Shopping List (Selected Recipes)');
    } else if (isCollectionMode) {
      lines.push(`MealDino Shopping List (${shoppingData.selectedCollectionName || 'Selected Collection'})`);
      lines.push(`Date Range: ${shoppingData.dateRange.start} to ${shoppingData.dateRange.end}`);
    } else {
      lines.push(`MealDino Shopping List (${shoppingData.dateRange.start} to ${shoppingData.dateRange.end})`);
    }
    lines.push('');
    if (isRecipeMode) {
      lines.push(`Selected recipes: ${shoppingData.selectedRecipeCount || selectedRecipes.length}`);
    } else if (isCollectionMode) {
      lines.push(`Collection recipes: ${shoppingData.selectedCollectionRecipeCount || 0}`);
      lines.push(`Collection-filtered plans: ${shoppingData.mealPlanCount}`);
    } else {
      lines.push(`Meal plans: ${shoppingData.mealPlanCount}`);
    }
    lines.push(`Planned meals: ${shoppingData.stats.plannedMeals}`);
    lines.push(`Cooking sessions: ${shoppingData.stats.cookingSessions}`);
    lines.push(`Planned servings: ${shoppingData.stats.totalPlannedServings}`);
    lines.push('');
    lines.push('Shopping List');

    for (const item of shoppingData.totals) {
      const unit = item.unit ? ` ${item.unit}` : '';
      lines.push(`- ${item.name}: ${formatDisplayQuantity(item.quantity)}${unit}`);
    }

    if (manualItems.length > 0) {
      lines.push('');
      lines.push('Manual Items');
      for (const item of manualItems) {
        const unit = item.unit ? ` ${item.unit}` : '';
        lines.push(`- ${item.name}: ${formatDisplayQuantity(item.quantity)}${unit}`);
      }
    }

    if (shoppingData.needsReview.length > 0) {
      lines.push('');
      lines.push('Needs Manual Quantity Check');
      for (const item of shoppingData.needsReview) {
        lines.push(`- ${item.name} (${item.occurrences} references)`);
      }
    }

    return lines.join('\n');
  };

  const groupedTotals = useMemo(() => {
    if (!shoppingData) return [];

    const groups = new Map<string, ShoppingItem[]>();

    for (const item of shoppingData.totals) {
      const aisle = item.aisle || 'Other';
      if (!groups.has(aisle)) groups.set(aisle, []);
      groups.get(aisle)?.push(item);
    }

    return Array.from(groups.entries())
      .sort((a, b) => {
        const aIndex = AISLE_ORDER.indexOf(a[0]);
        const bIndex = AISLE_ORDER.indexOf(b[0]);
        const safeA = aIndex === -1 ? AISLE_ORDER.length : aIndex;
        const safeB = bIndex === -1 ? AISLE_ORDER.length : bIndex;
        return safeA - safeB || a[0].localeCompare(b[0]);
      })
      .map(([aisle, items]) => ({
        aisle,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [shoppingData]);

  const addManualItem = async () => {
    const newItem: ManualShoppingItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: '',
      quantity: 1,
      unit: '',
      aisle: 'Other'
    };

    const nextManualItems = [...manualItems, newItem];
    setManualItems(nextManualItems);
    await saveChecklist(checkedKeys, nextManualItems);
  };

  const updateManualItem = (id: string, field: keyof ManualShoppingItem, value: string) => {
    setManualItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      if (field === 'quantity') {
        return { ...item, quantity: Number.isFinite(Number(value)) ? Number(value) : 0 };
      }
      return { ...item, [field]: value };
    }));
  };

  const persistManualItems = async () => {
    await saveChecklist(checkedKeys, manualItems);
    showToast('Manual items saved');
  };

  const removeManualItem = async (id: string) => {
    const removedItem = manualItems.find((item) => item.id === id);
    const removedIndex = manualItems.findIndex((item) => item.id === id);
    if (!removedItem || removedIndex < 0) return;

    const wasChecked = checkedKeys.includes(getManualChecklistKey(id));
    const nextManualItems = manualItems.filter((item) => item.id !== id);
    const nextChecked = checkedKeys.filter((key) => key !== getManualChecklistKey(id));
    setManualItems(nextManualItems);
    setCheckedKeys(nextChecked);
    await saveChecklist(nextChecked, nextManualItems);

    showToast('Manual item removed', {
      actionLabel: 'Undo',
      action: async () => {
        const restoredManualItems = [...nextManualItems];
        restoredManualItems.splice(removedIndex, 0, removedItem);
        const restoredChecked = wasChecked
          ? [...nextChecked, getManualChecklistKey(id)]
          : nextChecked;
        setManualItems(restoredManualItems);
        setCheckedKeys(restoredChecked);
        await saveChecklist(restoredChecked, restoredManualItems);
        showToast('Removal undone');
      },
      durationMs: 5000
    });
  };

  const updateIngredientAisleOverride = async (normalizedName: string | undefined, aisle: string) => {
    if (!normalizedName || !shoppingData) return;

    try {
      const response = await fetch('/api/ingredient-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          normalizedName,
          aisle
        })
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to save aisle override');
      }

      setShoppingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totals: prev.totals.map((item) => (
            item.normalizedName === normalizedName ? { ...item, aisle } : item
          )),
          needsReview: prev.needsReview.map((item) => (
            item.normalizedName === normalizedName ? { ...item, aisle } : item
          ))
        };
      });
      showToast('Aisle preference saved');
    } catch (error) {
      console.error('Failed to save aisle preference:', error);
      setError('Failed to save aisle preference.');
    }
  };

  const exportToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildExportText());
      showToast('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy shopping list:', err);
      setError('Failed to copy to clipboard.');
    }
  };

  const exportToAppleNotesClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildExportText());
      showToast('Copied in Notes format');
    } catch (err) {
      console.error('Failed to copy shopping list for notes:', err);
      setError('Failed to copy to clipboard.');
    }
  };

  const exportToFile = () => {
    const text = buildExportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isRecipeMode
      ? 'shopping-list-selected-recipes.txt'
      : isCollectionMode
        ? `shopping-list-collection-${startDate}-to-${endDate}.txt`
      : `shopping-list-${startDate}-to-${endDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareList = async () => {
    if (!canShare) return;

    try {
      await navigator.share({
        title: 'MealDino Shopping List',
        text: buildExportText()
      });
    } catch (err) {
      // User-cancel is expected on share dialogs; don't surface as an error.
      console.error('Share canceled or failed:', err);
    }
  };

  useEffect(() => {
    loadShoppingList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-white">How to build your list</p>
            <p className="text-xs text-gray-400">
              {isRecipeMode
                ? `Using ${selectedRecipes.length} selected recipe(s).`
                : isCollectionMode
                  ? 'Using only meals/sessions in your selected collection within this date range.'
                  : 'Use your plan dates or switch to recipe picker mode.'}
            </p>
          </div>
          <Link
            href="/shopping/generate"
            className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          >
            Generate from Recipes
          </Link>
        </div>

        {isRecipeMode ? (
          <div className="rounded-lg border border-blue-700/60 bg-blue-900/20 p-3 text-sm text-blue-100">
            This list is generated from your selected recipes and planned servings, not your calendar plan.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm text-gray-300 mb-2">Include</label>
                <div className="flex flex-wrap gap-4 min-h-10 items-center">
                  <label className="inline-flex items-center gap-2 text-gray-200 text-sm">
                    <input
                      type="checkbox"
                      checked={includeMeals}
                      onChange={(e) => setIncludeMeals(e.target.checked)}
                      className="accent-green-500"
                    />
                    Planned meals
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-200 text-sm">
                    <input
                      type="checkbox"
                      checked={includeCookingSessions}
                      onChange={(e) => setIncludeCookingSessions(e.target.checked)}
                      className="accent-green-500"
                    />
                    Cooking sessions
                  </label>
                </div>
              </div>

              <button
                onClick={loadShoppingList}
                disabled={loading || !isDateRangeValid || (isCollectionMode && !selectedCollectionId)}
                className="h-10 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4"
              >
                {loading ? 'Building...' : 'Build List'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => applyPreset(7)} className="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200">Next 7 days</button>
              <button onClick={() => applyPreset(14)} className="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200">Next 14 days</button>
              <button onClick={() => applyPreset(30)} className="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200">Next 30 days</button>
            </div>
          </>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Ingredient scaling uses planned servings divided by each recipe&apos;s serving yield.
        </p>
      </section>

      <section className="bg-gray-800/70 rounded-xl border border-gray-700 p-4">
        <p className="text-sm text-white font-medium mb-2">Quick Start</p>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>1) {isRecipeMode ? 'Generate from selected recipes or switch back to date-range mode.' : isCollectionMode ? 'Build your list from one collection over your selected date range.' : 'Build your list for 7, 14, or a custom date range.'}</li>
          <li>2) Check items as you shop, and add any missing manual items.</li>
          <li>3) Copy/download the list when you are ready to head out.</li>
        </ul>
      </section>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {shoppingData && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">{isRecipeMode ? 'Selected recipes' : isCollectionMode ? 'Collection recipes' : 'Meal plans'}</p>
              <p className="text-lg font-semibold text-white">
                {isRecipeMode
                  ? (shoppingData.selectedRecipeCount || selectedRecipes.length)
                  : isCollectionMode
                    ? (shoppingData.selectedCollectionRecipeCount || 0)
                    : shoppingData.mealPlanCount}
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Planned meals</p>
              <p className="text-lg font-semibold text-white">{shoppingData.stats.plannedMeals}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Cooking sessions</p>
              <p className="text-lg font-semibold text-white">{shoppingData.stats.cookingSessions}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Planned servings</p>
              <p className="text-lg font-semibold text-white">{shoppingData.stats.totalPlannedServings}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Needs review</p>
              <p className="text-lg font-semibold text-white">{shoppingData.needsReview.length}</p>
            </div>
          </section>

          <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-white">Shopping List</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setAllChecked(true)} className="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200">Check all</button>
                <button onClick={() => setAllChecked(false)} className="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200">Clear checked</button>
                <button onClick={exportToClipboard} className="px-3 py-1.5 text-xs rounded bg-green-700 hover:bg-green-600 text-white">Copy</button>
                <button onClick={exportToAppleNotesClipboard} className="px-3 py-1.5 text-xs rounded bg-green-700 hover:bg-green-600 text-white">Copy for Notes</button>
                <button onClick={exportToFile} className="px-3 py-1.5 text-xs rounded bg-green-700 hover:bg-green-600 text-white">Download</button>
                {canShare && (
                  <button onClick={shareList} className="px-3 py-1.5 text-xs rounded bg-green-700 hover:bg-green-600 text-white">Share</button>
                )}
              </div>
            </div>

            {savingChecklist && <p className="text-xs text-gray-400 mb-3">Saving checklist...</p>}
            <p className="text-xs text-gray-500 mb-3">“Copy for Notes” outputs a plain list so you can quickly convert it into native checklists in Apple Notes.</p>

            {shoppingData.totals.length === 0 ? (
              <p className="text-gray-400 text-sm">
                {isCollectionMode
                  ? 'No parseable ingredient quantities found for this collection in the selected date range.'
                  : 'No parseable ingredient quantities found in this date range.'}
              </p>
            ) : (
              <div className="space-y-4">
                {groupedTotals.map((group) => (
                  <div key={group.aisle}>
                    <h4 className="text-sm font-semibold text-green-300 mb-2">{group.aisle}</h4>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const checklistKey = getChecklistKey('total', item.key);
                        const checked = checkedKeys.includes(checklistKey);

                        return (
                          <div key={item.key} className={`rounded-lg border p-3 ${checked ? 'bg-gray-700/60 border-gray-700' : 'bg-gray-700 border-gray-600'}`}>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                              <div className="flex gap-3 items-start">
                                <input
                                  type="checkbox"
                                  className="accent-green-500 mt-1"
                                  checked={checked}
                                  onChange={() => toggleChecked(checklistKey)}
                                />
                                <div>
                                  <p className={`font-medium ${checked ? 'text-gray-400 line-through' : 'text-white'}`}>{item.name}</p>
                                  <p className="text-xs text-gray-400 mt-1">Used in {Math.round(item.occurrences * 100) / 100} serving(s)</p>
                                  <div className="mt-2">
                                    <select
                                      value={item.aisle || 'Other'}
                                      onChange={(e) => updateIngredientAisleOverride(item.normalizedName, e.target.value)}
                                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                                    >
                                      {AISLE_ORDER.map((aisle) => (
                                        <option key={aisle} value={aisle}>{aisle}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                              <p className={`font-semibold sm:whitespace-nowrap ${checked ? 'text-gray-500 line-through' : 'text-green-300'}`}>
                                {formatDisplayQuantity(item.quantity)} {item.unit || ''}
                              </p>
                            </div>
                            {item.sources.length > 0 && (
                              <p className="text-xs text-gray-500 mt-2">Examples: {item.sources.join(' • ')}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-white">Manual Items</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={addManualItem} className="px-3 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200">Add Item</button>
                <button onClick={persistManualItems} className="px-3 py-1.5 text-xs rounded bg-green-700 hover:bg-green-600 text-white">Save Manual Items</button>
              </div>
            </div>

            {manualItems.length === 0 ? (
              <p className="text-sm text-gray-400">No manual items yet. Add items not covered by your planned meals.</p>
            ) : (
              <div className="space-y-2">
                {manualItems.map((item) => {
                  const checklistKey = getManualChecklistKey(item.id);
                  const checked = checkedKeys.includes(checklistKey);

                  return (
                    <div key={item.id} className={`rounded-lg border p-3 ${checked ? 'bg-gray-700/60 border-gray-700' : 'bg-gray-700 border-gray-600'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-1 flex items-center">
                          <input
                            type="checkbox"
                            className="accent-green-500"
                            checked={checked}
                            onChange={() => toggleChecked(checklistKey)}
                          />
                        </div>
                        <input
                          value={item.name}
                          onChange={(e) => updateManualItem(item.id, 'name', e.target.value)}
                          className={`md:col-span-5 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm ${checked ? 'text-gray-400 line-through' : 'text-white'}`}
                          placeholder="Item name"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.25"
                          value={item.quantity}
                          onChange={(e) => updateManualItem(item.id, 'quantity', e.target.value)}
                          className="md:col-span-2 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                        />
                        <input
                          value={item.unit}
                          onChange={(e) => updateManualItem(item.id, 'unit', e.target.value)}
                          className="md:col-span-2 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                          placeholder="unit"
                        />
                        <select
                          value={item.aisle}
                          onChange={(e) => updateManualItem(item.id, 'aisle', e.target.value)}
                          className="md:col-span-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                        >
                          {AISLE_ORDER.map((aisle) => (
                            <option key={aisle} value={aisle}>{aisle}</option>
                          ))}
                        </select>
                        <div className="md:col-span-1 flex justify-end">
                          <button onClick={() => removeManualItem(item.id)} className="px-2 py-1 text-xs rounded bg-red-900/60 text-red-200 hover:bg-red-800">Remove</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {shoppingData.needsReview.length > 0 && (
            <section className="bg-gray-800 rounded-xl border border-yellow-700 p-4 sm:p-6">
              <h3 className="text-xl font-semibold text-yellow-200 mb-4">Needs Manual Quantity Check</h3>
              <div className="space-y-2">
                {shoppingData.needsReview.map((item) => {
                  const checklistKey = getChecklistKey('review', item.key);
                  const checked = checkedKeys.includes(checklistKey);

                  return (
                    <div key={item.key} className={`rounded-lg border p-3 ${checked ? 'bg-gray-700/60 border-gray-700' : 'bg-gray-700 border-gray-600'}`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                        <div className="flex gap-3 items-center">
                          <input
                            type="checkbox"
                            className="accent-green-500"
                            checked={checked}
                            onChange={() => toggleChecked(checklistKey)}
                          />
                          <p className={`font-medium ${checked ? 'text-gray-400 line-through' : 'text-white'}`}>{item.name}</p>
                        </div>
                        <p className="text-xs text-yellow-200">Referenced {Math.round(item.occurrences * 100) / 100}x</p>
                      </div>
                      {item.sources.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">Examples: {item.sources.join(' • ')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <span>{toastMessage}</span>
          {toastAction && toastActionLabel && (
            <button
              type="button"
              onClick={toastAction}
              className="px-2 py-1 text-xs rounded bg-green-800 hover:bg-green-700"
            >
              {toastActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
