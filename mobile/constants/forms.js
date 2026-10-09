export function validateDonationItems(items = []) {
  return items.length > 0 && items.every((item) => item.name?.trim() && Number(item.quantityGrams) >= 250);
}

export function validateCoordinates(coordinates = []) {
  const [longitude, latitude] = coordinates.map(Number);
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function validateDonationLogistics({ preparedAt, pickupDeadline, coordinates, now = new Date() }) {
  const prepared = new Date(preparedAt);
  const deadline = new Date(pickupDeadline);
  if (!Number.isFinite(prepared.getTime()) || !Number.isFinite(deadline.getTime())) return "Enter valid preparation and pickup times";
  if (deadline <= now || prepared >= deadline) return "Pickup deadline must be in the future and after preparation time";
  if (!validateCoordinates(coordinates)) return "Enter valid latitude and longitude";
  return null;
}

export function buildDonationPayload({ items, preparedAt, pickupDeadline, packagingType, coordinates }) {
  return {
    items: items.map(({ analysisStatus, message, ...item }) => ({ ...item, quantityGrams: Number(item.quantityGrams), donorConfirmed: true })),
    preparedAt,
    pickupDeadline,
    packagingType,
    location: { type: "Point", coordinates: coordinates.map(Number) },
  };
}

export function validateBeneficiaryGroups(groups = []) {
  return groups.length > 0 && groups.every((group) => Number.isInteger(Number(group.count)) && Number(group.count) > 0);
}

