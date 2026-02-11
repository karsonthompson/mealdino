'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Strictness = 'flexible' | 'balanced' | 'strict';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface AgentProfile {
  _id?: string;
  medicalDisclaimerAcceptedAt?: string | null;
  optimizationGoal: string;
  strictness: Strictness;
  hardConstraints: string[];
  softPreferences: string[];
  nutritionTargets: {
    source: 'user' | 'estimated' | 'none';
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
  budget: {
    enabled: boolean;
    weeklyAmount: number | null;
    currency: string;
  };
  planPreferences: {
    allowGeneratedRecipes: boolean;
    includeGlobalRecipes: boolean;
    includeUserRecipes: boolean;
    avoidRepeatMeals: boolean;
    leftoversPreference: 'none' | 'light' | 'moderate' | 'heavy';
    batchCookingPreference: 'none' | 'light' | 'moderate' | 'heavy';
    maxCookTimeMinutes: number | null;
  };
}

interface DraftMeal {
  type: MealType;
  recipe: string;
  notes?: string;
  source?: 'fresh' | 'leftovers' | 'meal_prep' | 'frozen';
  plannedServings?: number;
  excludeFromShopping?: boolean;
}

interface DraftMealDay {
  date: string;
  meals: DraftMeal[];
  cookingSessions: any[];
}

interface RecipeCatalogEntry {
  _id: string;
  title: string;
  prepTime?: number;
}

interface AgentRun {
  _id: string;
  status: 'draft' | 'approved' | 'applied' | 'failed';
  dateRange: { start: string; end: string };
  summary?: {
    whyThisPlan?: string;
    unmetConstraints?: string[];
    notes?: string[];
  };
  outputDraft?: {
    mealPlanDays?: DraftMealDay[];
    shoppingList?: {
      totals?: any[];
      needsReview?: any[];
    } | null;
    cookingSchedule?: Array<{ date: string; tasks: string[] }> | null;
    createdRecipes?: Array<{ _id?: string; title?: string }> | null;
    recipeCatalog?: RecipeCatalogEntry[] | null;
    validation?: {
      hardConstraintViolations?: string[];
      hardConstraintPass?: boolean;
    } | null;
  };
}

interface AgentMessage {
  _id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  createdAt: string;
}

interface AgentRuntimeStatus {
  llmConnected: boolean;
  mode: 'llm' | 'fallback';
  model: string;
}

const DEFAULT_PROFILE: AgentProfile = {
  optimizationGoal: '',
  strictness: 'balanced',
  hardConstraints: [],
  softPreferences: [],
  nutritionTargets: {
    source: 'none',
    calories: null,
    protein: null,
    carbs: null,
    fat: null
  },
  budget: {
    enabled: false,
    weeklyAmount: null,
    currency: 'USD'
  },
  planPreferences: {
    allowGeneratedRecipes: true,
    includeGlobalRecipes: true,
    includeUserRecipes: true,
    avoidRepeatMeals: true,
    leftoversPreference: 'moderate',
    batchCookingPreference: 'moderate',
    maxCookTimeMinutes: null
  }
};

function formatDateForInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mergeProfileData(data: Partial<AgentProfile> | null | undefined): AgentProfile {
  return {
    ...DEFAULT_PROFILE,
    ...(data || {}),
    nutritionTargets: {
      ...DEFAULT_PROFILE.nutritionTargets,
      ...((data as AgentProfile | undefined)?.nutritionTargets || {})
    },
    budget: {
      ...DEFAULT_PROFILE.budget,
      ...((data as AgentProfile | undefined)?.budget || {})
    },
    planPreferences: {
      ...DEFAULT_PROFILE.planPreferences,
      ...((data as AgentProfile | undefined)?.planPreferences || {})
    }
  };
}

export default function AgentPageClient() {
  const [profile, setProfile] = useState<AgentProfile>(DEFAULT_PROFILE);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runsLoading, setRunsLoading] = useState(true);

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [creatingRun, setCreatingRun] = useState(false);

  const [runtimeStatus, setRuntimeStatus] = useState<AgentRuntimeStatus | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [dateStart, setDateStart] = useState(formatDateForInput(new Date()));
  const [dateEnd, setDateEnd] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 6);
    return formatDateForInput(end);
  });

  const [draftMealPlanDays, setDraftMealPlanDays] = useState<DraftMealDay[]>([]);
  const [savingDraftEdits, setSavingDraftEdits] = useState(false);

  const selectedRun = useMemo(
    () => runs.find((run) => run._id === selectedRunId) || null,
    [runs, selectedRunId]
  );

  const recipeCatalog = useMemo(
    () => selectedRun?.outputDraft?.recipeCatalog || [],
    [selectedRun]
  );

  const recipeTitleById = useMemo(
    () => new Map((recipeCatalog || []).map((recipe) => [String(recipe._id), recipe.title])),
    [recipeCatalog]
  );

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const response = await fetch('/api/agent/profile');
      const result = await response.json();
      if (response.ok && result?.success && result?.data) {
        setProfile(mergeProfileData(result.data));
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    } catch (error) {
      console.error('Failed to load agent profile:', error);
      setProfile(DEFAULT_PROFILE);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const response = await fetch('/api/agent/runs?limit=20');
      const result = await response.json();
      if (response.ok && result?.success && Array.isArray(result?.data)) {
        setRuns(result.data);
        setSelectedRunId((current) => {
          if (current && result.data.some((run: AgentRun) => run._id === current)) {
            return current;
          }
          return result.data[0]?._id || null;
        });
      } else {
        setRuns([]);
        setSelectedRunId(null);
      }
    } catch (error) {
      console.error('Failed to load agent runs:', error);
      setRuns([]);
      setSelectedRunId(null);
    } finally {
      setRunsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (runId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/agent/runs/${runId}/messages?limit=200`);
      const result = await response.json();
      if (response.ok && result?.success && Array.isArray(result?.data)) {
        setMessages(result.data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load agent messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const loadRuntimeStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/agent/status');
      const result = await response.json();
      if (response.ok && result?.success && result?.data) {
        setRuntimeStatus(result.data as AgentRuntimeStatus);
      } else {
        setRuntimeStatus(null);
      }
    } catch (error) {
      console.error('Failed to load runtime status:', error);
      setRuntimeStatus(null);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadRuns();
    loadRuntimeStatus();
  }, [loadProfile, loadRuns, loadRuntimeStatus]);

  useEffect(() => {
    if (!selectedRunId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedRunId);
  }, [loadMessages, selectedRunId]);

  useEffect(() => {
    setDraftMealPlanDays(selectedRun?.outputDraft?.mealPlanDays || []);
  }, [selectedRun]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const response = await fetch('/api/agent/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const result = await response.json();
      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || 'Failed to save settings');
      }
      setProfile(mergeProfileData(result.data));
      alert('Agent settings saved.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setProfileSaving(false);
    }
  };

  const createRun = async () => {
    const response = await fetch('/api/agent/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRange: { start: dateStart, end: dateEnd },
        overwriteExistingDays: true
      })
    });

    const result = await response.json();
    if (!response.ok || !result?.success || !result?.data?._id) {
      throw new Error(result?.message || 'Failed to create run');
    }

    const newRun = result.data as AgentRun;
    const newRunId = String(newRun._id);

    setRuns((prev) => [newRun, ...prev.filter((run) => run._id !== newRunId)]);
    setSelectedRunId(newRunId);
    setMessages([]);

    return newRunId;
  };

  const startNewRun = async () => {
    if (creatingRun || actionLoading) return;
    setCreatingRun(true);
    try {
      const runId = await createRun();
      await loadMessages(runId);
      setChatInput('');
    } catch (error) {
      console.error('Failed to create a new run:', error);
      alert(error instanceof Error ? error.message : 'Failed to start a new chat');
    } finally {
      setCreatingRun(false);
    }
  };

  const ensureRunId = async () => {
    if (selectedRunId) return selectedRunId;
    return await createRun();
  };

  const sendMessage = async () => {
    const content = chatInput.trim();
    if (!content) return;

    setActionLoading(true);
    setChatInput('');
    try {
      const runId = await ensureRunId();

      const response = await fetch(`/api/agent/runs/${runId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to send message');
      }

      await loadRuns();
      await loadMessages(runId);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setActionLoading(false);
    }
  };

  const updateDraftMeal = (
    dayIndex: number,
    mealIndex: number,
    field: keyof DraftMeal,
    value: string | number | boolean
  ) => {
    setDraftMealPlanDays((prev) => prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      return {
        ...day,
        meals: day.meals.map((meal, mIdx) => {
          if (mIdx !== mealIndex) return meal;
          return { ...meal, [field]: value };
        })
      };
    }));
  };

  const saveDraftEdits = async () => {
    if (!selectedRunId) return;
    if (!Array.isArray(draftMealPlanDays) || draftMealPlanDays.length === 0) {
      alert('No draft plan to save.');
      return;
    }

    setSavingDraftEdits(true);
    try {
      const response = await fetch(`/api/agent/runs/${selectedRunId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlanDays: draftMealPlanDays, applyToPlan: true })
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to save draft edits');
      }
      await loadRuns();
      alert(`Saved and synced to your plan (${Number(result?.meta?.appliedDays || 0)} day(s)).`);
    } catch (error) {
      console.error('Failed to save draft edits:', error);
      alert(error instanceof Error ? error.message : 'Failed to save draft edits');
    } finally {
      setSavingDraftEdits(false);
    }
  };

  const onKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white text-lg font-semibold">Agent Chat</h3>
          <p className="text-xs text-gray-400">Tell the agent what you want. It will generate, revise, or apply when you ask.</p>
          {runtimeStatus && (
            <p className="text-xs mt-1 text-gray-400">
              {runtimeStatus.llmConnected
                ? `LLM Connected (${runtimeStatus.model})`
                : 'Fallback Mode (OpenAI key not detected)'}
            </p>
          )}
          {selectedRun && (
            <p className="text-xs text-gray-500 mt-1">
              Run {selectedRun._id.slice(-6)} • {selectedRun.dateRange.start} to {selectedRun.dateRange.end} • {selectedRun.status}
            </p>
          )}
          {!selectedRun && !runsLoading && (
            <p className="text-xs text-gray-500 mt-1">No run yet. Your first message will start one automatically.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void startNewRun()}
            disabled={creatingRun || actionLoading}
            className="px-3 py-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm disabled:opacity-50"
          >
            {creatingRun ? 'Starting...' : 'New Plan Chat'}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            className="px-3 py-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm"
          >
            {settingsOpen ? 'Close Settings' : 'Settings'}
          </button>
        </div>
      </div>

      <div className="border border-gray-700 rounded-3xl bg-gray-900/50 p-4 h-[26rem] overflow-y-auto space-y-3">
        {messagesLoading ? (
          <p className="text-sm text-gray-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400">Start by telling the agent your goals, constraints, and time range.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm border ${
                message.role === 'user'
                  ? 'bg-gray-700 border-gray-600 text-gray-100'
                  : message.role === 'assistant'
                    ? 'bg-gray-800 border-gray-700 text-gray-100'
                    : 'bg-gray-900 border-gray-700 text-gray-300'
              }`}
            >
                <p className="text-[10px] uppercase tracking-wide opacity-75 mb-1">
                  {message.role === 'user' ? 'You' : message.role}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={onKeyDownInput}
          placeholder="Type your request... e.g., 'Build me a 7-day high-protein plan and shopping list'"
          className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-3 text-sm text-white"
        />
        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={actionLoading}
          className="px-5 py-3 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white text-sm disabled:opacity-50"
        >
          {actionLoading ? 'Working...' : 'Send'}
        </button>
      </div>

      {selectedRun && draftMealPlanDays.length > 0 && (
        <div className="border border-gray-700 rounded-3xl bg-gray-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-white font-semibold">Plan Preview (Editable)</p>
            <button
              type="button"
              onClick={saveDraftEdits}
              disabled={savingDraftEdits || actionLoading}
              className="px-3 py-1 text-xs rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white disabled:opacity-50"
            >
              {savingDraftEdits ? 'Saving...' : 'Save Plan Edits'}
            </button>
          </div>

          {!!selectedRun.outputDraft?.validation?.hardConstraintViolations?.length && (
            <div className="text-xs text-yellow-200">
              Hard constraint issues: {selectedRun.outputDraft.validation.hardConstraintViolations.join(' | ')}
            </div>
          )}

          <div className="max-h-[24rem] overflow-y-auto space-y-3 pr-1">
            {draftMealPlanDays.map((day, dayIndex) => (
              <div key={day.date} className="border border-gray-700 rounded-lg p-3 bg-gray-800/60">
                <p className="text-xs text-gray-200 font-semibold mb-2">
                  {day.date}
                  {!!day.cookingSessions?.length && (
                    <span className="ml-2 text-[11px] text-gray-400">
                      ({day.cookingSessions.length} cook session{day.cookingSessions.length > 1 ? 's' : ''})
                    </span>
                  )}
                </p>
                <div className="space-y-2">
                  {day.meals.map((meal, mealIndex) => (
                    <div key={`${day.date}-${mealIndex}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <select
                        value={meal.type}
                        onChange={(e) => updateDraftMeal(dayIndex, mealIndex, 'type', e.target.value as MealType)}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>

                      <select
                        value={String(meal.recipe)}
                        onChange={(e) => updateDraftMeal(dayIndex, mealIndex, 'recipe', e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white md:col-span-2"
                      >
                        {recipeCatalog.map((recipe) => (
                          <option key={recipe._id} value={recipe._id}>
                            {recipe.title}
                          </option>
                        ))}
                      </select>

                      <label className="flex items-center gap-2 text-[11px] text-gray-300">
                        <span>Servings</span>
                        <input
                          type="number"
                          min="1"
                          max="4"
                          value={meal.plannedServings || 1}
                          onChange={(e) => {
                            const nextValue = Number(e.target.value);
                            const clamped = Number.isFinite(nextValue)
                              ? Math.min(4, Math.max(1, Math.round(nextValue)))
                              : 1;
                            updateDraftMeal(dayIndex, mealIndex, 'plannedServings', clamped);
                          }}
                          className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                        />
                      </label>

                      <p className="text-[11px] text-gray-400 md:col-span-4">
                        {recipeTitleById.get(String(meal.recipe)) || 'Unknown recipe'}
                        {meal.source ? ` • ${meal.source}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 flex justify-end" onClick={() => setSettingsOpen(false)}>
          <aside
            className="h-full w-full max-w-md bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Agent Settings</h4>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="text-sm text-gray-300 hover:text-white"
              >
                Close
              </button>
            </div>

            {profileLoading ? (
              <p className="text-sm text-gray-400">Loading settings...</p>
            ) : (
              <div className="space-y-3">
                <label className="text-xs text-gray-400 block">
                  Default run start
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="text-xs text-gray-400 block">
                  Default run end
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="text-xs text-gray-400 block">
                  Optimization goal
                  <textarea
                    value={profile.optimizationGoal}
                    onChange={(e) => setProfile((prev) => ({ ...prev, optimizationGoal: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="text-xs text-gray-400 block">
                  Strictness
                  <select
                    value={profile.strictness}
                    onChange={(e) => setProfile((prev) => ({ ...prev, strictness: e.target.value as Strictness }))}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="flexible">Flexible</option>
                    <option value="balanced">Balanced</option>
                    <option value="strict">Strict</option>
                  </select>
                </label>

                <label className="text-xs text-gray-400 block">
                  Hard constraints (comma-separated)
                  <input
                    value={profile.hardConstraints.join(', ')}
                    onChange={(e) => setProfile((prev) => ({
                      ...prev,
                      hardConstraints: e.target.value.split(',').map((v) => v.trim()).filter(Boolean)
                    }))}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </label>

                <label className="text-xs text-gray-400 block">
                  Soft preferences (comma-separated)
                  <input
                    value={profile.softPreferences.join(', ')}
                    onChange={(e) => setProfile((prev) => ({
                      ...prev,
                      softPreferences: e.target.value.split(',').map((v) => v.trim()).filter(Boolean)
                    }))}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-gray-400 block">
                    Calories
                    <input
                      type="number"
                      value={profile.nutritionTargets.calories ?? ''}
                      onChange={(e) => setProfile((prev) => ({
                        ...prev,
                        nutritionTargets: {
                          ...prev.nutritionTargets,
                          source: 'user',
                          calories: e.target.value ? Number(e.target.value) : null
                        }
                      }))}
                      className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-gray-400 block">
                    Protein (g)
                    <input
                      type="number"
                      value={profile.nutritionTargets.protein ?? ''}
                      onChange={(e) => setProfile((prev) => ({
                        ...prev,
                        nutritionTargets: {
                          ...prev.nutritionTargets,
                          source: 'user',
                          protein: e.target.value ? Number(e.target.value) : null
                        }
                      }))}
                      className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>

                <label className="text-xs text-gray-400 block">
                  <input
                    type="checkbox"
                    checked={profile.planPreferences.avoidRepeatMeals}
                    onChange={(e) => setProfile((prev) => ({
                      ...prev,
                      planPreferences: {
                        ...prev.planPreferences,
                        avoidRepeatMeals: e.target.checked
                      }
                    }))}
                    className="accent-gray-300 mr-2"
                  />
                  Avoid repeat meals by default
                </label>

                <label className="text-xs text-gray-400 block">
                  <input
                    type="checkbox"
                    checked={Boolean(profile.medicalDisclaimerAcceptedAt)}
                    onChange={(e) => setProfile((prev) => ({
                      ...prev,
                      medicalDisclaimerAcceptedAt: e.target.checked ? new Date().toISOString() : null
                    }))}
                    className="accent-gray-300 mr-2"
                  />
                  I understand this is not medical advice.
                </label>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-full px-4 py-2 text-sm border border-gray-600"
                >
                  {profileSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
