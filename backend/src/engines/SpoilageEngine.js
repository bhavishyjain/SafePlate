/**
 * Spoilage Risk Engine
 * Math formula from LLD:
 * timeRisk = clamp(hoursSincePrep / baseShelfLifeHours, 0, 1)
 * packagingFactor: SEALED_PACKAGED (0.8), CLOSED_CONTAINER (1.0), OPEN_OR_BULK (1.2)
 * storageFactor: FROZEN (0.5), REFRIGERATED (1.0), ROOM_TEMPERATURE (1.5)
 * riskScore = min(1.0, timeRisk * packagingFactor * storageFactor)
 */
export function calculateSpoilageRisk(
  preparedAt,
  baseShelfLifeHours,
  packagingType,
  storageCondition
) {
  const hoursSincePrep = (Date.now() - new Date(preparedAt).getTime()) / (1000 * 60 * 60);
  const timeRisk = Math.min(1.0, Math.max(0.0, hoursSincePrep / baseShelfLifeHours));

  const packagingFactor = {
    SEALED_PACKAGED: 0.8,
    CLOSED_CONTAINER: 1.0,
    OPEN_OR_BULK: 1.2,
  }[packagingType] || 1.0;

  const storageFactor = {
    FROZEN: 0.5,
    REFRIGERATED: 1.0,
    ROOM_TEMPERATURE: 1.5,
  }[storageCondition] || 1.0;

  return Math.min(1.0, timeRisk * packagingFactor * storageFactor);
}
