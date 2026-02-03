import dbConnect from './mongodb';
import ShoppingChecklist from '@/models/ShoppingChecklist';

export function buildChecklistSignature({ startDate, endDate, includeMeals, includeCookingSessions }) {
  return [
    startDate,
    endDate,
    includeMeals ? 'meals1' : 'meals0',
    includeCookingSessions ? 'sessions1' : 'sessions0'
  ].join('|');
}

export async function getShoppingChecklist({ userId, startDate, endDate, includeMeals, includeCookingSessions }) {
  await dbConnect();

  const signature = buildChecklistSignature({
    startDate,
    endDate,
    includeMeals,
    includeCookingSessions
  });

  const checklist = await ShoppingChecklist.findOne({ userId, signature });

  return {
    signature,
    checkedKeys: checklist?.checkedKeys || [],
    manualItems: checklist?.manualItems || []
  };
}

export async function upsertShoppingChecklist({
  userId,
  startDate,
  endDate,
  includeMeals,
  includeCookingSessions,
  checkedKeys,
  manualItems
}) {
  await dbConnect();

  const signature = buildChecklistSignature({
    startDate,
    endDate,
    includeMeals,
    includeCookingSessions
  });

  const uniqueCheckedKeys = Array.from(new Set((checkedKeys || []).filter(Boolean)));
  const cleanedManualItems = (manualItems || [])
    .filter((item) => item && typeof item.name === 'string' && item.name.trim() !== '')
    .map((item) => ({
      id: String(item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      name: item.name.trim(),
      quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0,
      unit: String(item.unit || '').trim(),
      aisle: String(item.aisle || 'Other').trim() || 'Other'
    }));

  const checklist = await ShoppingChecklist.findOneAndUpdate(
    { userId, signature },
    {
      userId,
      signature,
      startDate,
      endDate,
      includeMeals,
      includeCookingSessions,
      checkedKeys: uniqueCheckedKeys,
      manualItems: cleanedManualItems
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  return {
    signature,
    checkedKeys: checklist.checkedKeys || [],
    manualItems: checklist.manualItems || []
  };
}
