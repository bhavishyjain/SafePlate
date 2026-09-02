import { beneficiaryNutritionReferences, NUTRITION_REFERENCE_VERSION } from "../domain/nutritionReferences.js";

export function calculateNgoNutrition(beneficiaryGroups) {
  const totals = beneficiaryGroups.reduce(
    (sum, group) => {
      const reference = beneficiaryNutritionReferences[group.category];
      if (!reference) throw new TypeError(`Unknown beneficiary category: ${group.category}`);
      sum.capacity += group.count;
      sum.caloriesPerDay += group.count * reference.caloriesPerDay;
      sum.proteinGramsPerDay += group.count * reference.proteinGramsPerDay;
      return sum;
    },
    { capacity: 0, caloriesPerDay: 0, proteinGramsPerDay: 0 }
  );
  return { ...totals, referenceVersion: NUTRITION_REFERENCE_VERSION };
}

export function effectiveNgoNutrition(ngo) {
  const override = ngo.nutritionOverride;
  if (override?.caloriesPerDay && override?.proteinGramsPerDay) {
    return { caloriesPerDay: override.caloriesPerDay, proteinGramsPerDay: override.proteinGramsPerDay, source: "ADMIN_OVERRIDE" };
  }
  return { caloriesPerDay: ngo.calculatedNutrition.caloriesPerDay, proteinGramsPerDay: ngo.calculatedNutrition.proteinGramsPerDay, source: ngo.calculatedNutrition.referenceVersion };
}
