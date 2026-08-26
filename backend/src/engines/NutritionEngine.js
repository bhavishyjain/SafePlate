/**
 * Nutrition Engine
 * Math formula from LLD:
 * donationCalories = caloriesPer100g * quantityKg * 10
 * donationProtein  = proteinPer100g  * quantityKg * 10
 * gapCalories = max(0, targetCaloriesPerDay - deliveredCaloriesToday)
 * gapProtein  = max(0, targetProteinPerDay  - deliveredProteinToday)
 * fillCal  = min(1, donationCalories / max(gapCalories, 1))
 * fillProt = min(1, donationProtein  / max(gapProtein, 1))
 * nutritionScore = 0.5 * fillCal + 0.5 * fillProt
 */
export function calculateNutritionScore(
  caloriesPer100g,
  proteinPer100g,
  quantityKg,
  targetCaloriesPerDay,
  targetProteinPerDay,
  deliveredCaloriesToday,
  deliveredProteinToday
) {
  const donationCalories = caloriesPer100g * quantityKg * 10;
  const donationProtein = proteinPer100g * quantityKg * 10;

  const gapCalories = Math.max(0, targetCaloriesPerDay - deliveredCaloriesToday);
  const gapProtein = Math.max(0, targetProteinPerDay - deliveredProteinToday);

  const fillCal = Math.min(1.0, donationCalories / Math.max(gapCalories, 1));
  const fillProt = Math.min(1.0, donationProtein / Math.max(gapProtein, 1));

  const nutritionScore = 0.5 * fillCal + 0.5 * fillProt;

  return {
    nutritionScore,
    donationCalories,
    donationProtein,
  };
}
