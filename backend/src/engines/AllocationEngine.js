const EARTH_RADIUS_KM = 6371;
export const ALLOCATION_ALGORITHM_VERSION = "SAFEPLATE_ALLOCATION_V1";

const radians = (degrees) => (degrees * Math.PI) / 180;
const identifier = (value) => String(value?._id ?? value);

export function haversineDistanceKm(origin, destination) {
  const [originLongitude, originLatitude] = origin.coordinates;
  const [destinationLongitude, destinationLatitude] = destination.coordinates;
  const latitudeDelta = radians(destinationLatitude - originLatitude);
  const longitudeDelta = radians(destinationLongitude - originLongitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(originLatitude)) * Math.cos(radians(destinationLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(value));
}

export function donationNutrition(items) {
  return items.reduce((total, item) => {
    const units = item.quantityGrams / 100;
    total.calories += item.nutritionPer100g.calories * units;
    total.proteinGrams += item.nutritionPer100g.proteinGrams * units;
    return total;
  }, { calories: 0, proteinGrams: 0 });
}

function nutritionCoverage(donation, remaining) {
  const fills = [];
  if (remaining.calories > 0) fills.push(Math.min(1, donation.calories / remaining.calories));
  if (remaining.proteinGrams > 0) fills.push(Math.min(1, donation.proteinGrams / remaining.proteinGrams));
  return fills.length ? fills.reduce((sum, fill) => sum + fill, 0) / fills.length : 0;
}

export function runHeuristicAllocation(donations, ngos, deliveredByNgo = new Map(), options = {}) {
  const maximumPickupRadiusKm = options.maximumPickupRadiusKm ?? 25;
  const nutritionWeight = options.nutritionWeight ?? 0.7;
  const distanceWeight = options.distanceWeight ?? 0.3;
  const evaluatedAt = options.evaluatedAt ?? new Date();
  const excludedNgoIdsByDonation = options.excludedNgoIdsByDonation ?? new Map();
  if (Math.abs(nutritionWeight + distanceWeight - 1) > 1e-9) throw new TypeError("Allocation weights must total 1");

  const runningNutrition = new Map(ngos.map((ngo) => {
    const delivered = deliveredByNgo.get(identifier(ngo)) ?? {};
    return [identifier(ngo), { calories: delivered.calories ?? 0, proteinGrams: delivered.proteinGrams ?? 0 }];
  }));
  const sortedDonations = [...donations].sort((left, right) => {
    const deadlineDifference = new Date(left.pickupDeadline) - new Date(right.pickupDeadline);
    if (deadlineDifference !== 0) return deadlineDifference;
    const createdDifference = new Date(left.createdAt ?? 0) - new Date(right.createdAt ?? 0);
    return createdDifference || identifier(left).localeCompare(identifier(right));
  });

  const proposals = [];
  for (const donation of sortedDonations) {
    const nutrition = donationNutrition(donation.items);
    const excluded = new Set(excludedNgoIdsByDonation.get(identifier(donation)) ?? []);
    const candidates = ngos.map((ngo) => {
      const ngoId = identifier(ngo);
      if (excluded.has(ngoId)) return null;
      const distanceKm = haversineDistanceKm(donation.location, ngo.location);
      if (distanceKm > maximumPickupRadiusKm) return null;
      const target = ngo.effectiveNutrition ?? ngo.calculatedNutrition;
      const delivered = runningNutrition.get(ngoId);
      const remaining = {
        calories: Math.max(0, target.caloriesPerDay - delivered.calories),
        proteinGrams: Math.max(0, target.proteinGramsPerDay - delivered.proteinGrams),
      };
      const hasNutritionGap = remaining.calories > 0 || remaining.proteinGrams > 0;
      const nutritionScore = nutritionCoverage(nutrition, remaining);
      const distanceScore = Math.max(0, 1 - distanceKm / maximumPickupRadiusKm);
      return { ngoId, hasNutritionGap, distanceKm, remaining, nutritionScore, distanceScore, matchScore: nutritionWeight * nutritionScore + distanceWeight * distanceScore };
    }).filter(Boolean);
    if (candidates.length === 0) continue;

    const withGap = candidates.filter((candidate) => candidate.hasNutritionGap);
    const ranked = withGap.length > 0 ? withGap : candidates;
    ranked.sort((left, right) => withGap.length === 0
      ? left.distanceKm - right.distanceKm || left.ngoId.localeCompare(right.ngoId)
      : right.matchScore - left.matchScore || left.distanceKm - right.distanceKm || left.ngoId.localeCompare(right.ngoId));
    const best = ranked[0];
    const running = runningNutrition.get(best.ngoId);
    running.calories += nutrition.calories;
    running.proteinGrams += nutrition.proteinGrams;
    proposals.push({
      donationId: identifier(donation), ngoId: best.ngoId, matchScore: best.matchScore,
      scoreSnapshot: {
        donationCalories: nutrition.calories, donationProteinGrams: nutrition.proteinGrams,
        remainingCaloriesBeforeAssignment: best.remaining.calories, remainingProteinGramsBeforeAssignment: best.remaining.proteinGrams,
        nutritionScore: best.nutritionScore, distanceKm: best.distanceKm, distanceScore: best.distanceScore,
        nutritionWeight, distanceWeight, maximumPickupRadiusKm, algorithmVersion: ALLOCATION_ALGORITHM_VERSION, evaluatedAt,
      },
    });
  }
  return proposals;
}
