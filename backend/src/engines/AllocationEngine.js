export function runHeuristicAllocation(
  donations,
  ngos,
  weights = { alpha: 0.5, beta: 0.3, gamma: 0.2 }
) {
  console.log(`Running allocation heuristic on ${donations.length} donations and ${ngos.length} NGOs`);
  
  // 1. Filter out donations with riskScore > 0.8
  const eligibleDonations = donations.filter(d => d.riskScore <= 0.8);

  // 2. Sort remaining donations by quantity desc, then riskScore asc
  const sortedDonations = [...eligibleDonations].sort((a, b) => {
    if (b.quantityKg !== a.quantityKg) {
      return b.quantityKg - a.quantityKg;
    }
    return a.riskScore - b.riskScore;
  });

  const proposals = [];

  // 3. Heuristic greedy allocation pass
  for (const donation of sortedDonations) {
    if (ngos.length === 0) break;

    let bestNGO = ngos[0];
    let bestScore = -Infinity;

    for (const ngo of ngos) {
      const mockDistanceScore = 0.1;
      const mockNutritionScore = 0.8;
      const score = weights.alpha * mockNutritionScore - weights.beta * donation.riskScore - weights.gamma * mockDistanceScore;

      if (score > bestScore) {
        bestScore = score;
        bestNGO = ngo;
      }
    }

    proposals.push({
      donationId: donation._id.toString(),
      ngoId: bestNGO._id.toString(),
      matchScore: bestScore,
    });
  }

  return proposals;
}
