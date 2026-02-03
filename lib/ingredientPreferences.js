import dbConnect from './mongodb';
import IngredientPreference from '@/models/IngredientPreference';

export async function getAisleOverrides(userId) {
  await dbConnect();

  const prefs = await IngredientPreference.find({ userId });
  const map = {};

  for (const pref of prefs) {
    map[pref.normalizedName] = pref.aisle;
  }

  return map;
}

export async function upsertAisleOverride(userId, normalizedName, aisle) {
  await dbConnect();

  const cleanName = String(normalizedName || '').trim().toLowerCase();
  const cleanAisle = String(aisle || 'Other').trim() || 'Other';

  if (!cleanName) {
    throw new Error('normalizedName is required');
  }

  const pref = await IngredientPreference.findOneAndUpdate(
    { userId, normalizedName: cleanName },
    { userId, normalizedName: cleanName, aisle: cleanAisle },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    normalizedName: pref.normalizedName,
    aisle: pref.aisle
  };
}
