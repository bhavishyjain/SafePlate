export const DONATION_STATUSES = ["PENDING", "ASSIGNED", "PICKED_UP", "DELIVERED", "DISCARDED"];
export const ALLOCATION_STATUSES = ["ASSIGNED", "PICKED_UP", "DELIVERED", "REJECTED", "CANCELLED"];

export const PACKAGING_OPTIONS = [
  { value: "SEALED_PACKAGED", label: "Sealed packaged food" },
  { value: "CLOSED_CONTAINER", label: "Food in a closed container" },
  { value: "OPEN_OR_BULK", label: "Food stored open or in bulk" },
];

export const NGO_TYPE_OPTIONS = [
  { value: "ORPHANAGE", label: "Orphanage" },
  { value: "OLD_AGE_HOME", label: "Old-age home" },
  { value: "SHELTER", label: "Shelter" },
  { value: "SCHOOL", label: "School" },
  { value: "OTHER", label: "Other" },
];

export const BENEFICIARY_OPTIONS = [
  { value: "CHILD_1_TO_5", label: "Children aged 1–5", calories: 1200, protein: 17 },
  { value: "CHILD_6_TO_9", label: "Children aged 6–9", calories: 1700, protein: 30 },
  { value: "CHILD_10_TO_12", label: "Children aged 10–12", calories: 2200, protein: 40 },
  { value: "TEEN_13_TO_15", label: "Teenagers aged 13–15", calories: 2500, protein: 52 },
  { value: "TEEN_16_TO_18", label: "Teenagers aged 16–18", calories: 2700, protein: 58 },
  { value: "ADULT_19_TO_29", label: "Adults aged 19–29", calories: 2300, protein: 54 },
  { value: "ADULT_30_TO_59", label: "Adults aged 30–59", calories: 2200, protein: 54 },
  { value: "OLDER_ADULT_60_PLUS", label: "Adults aged 60+", calories: 1900, protein: 54 },
];

export const labelFor = (value) => value?.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()) || "—";

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export function nutritionTotals(items = []) {
  return items.reduce((total, item) => {
    const factor = Number(item.quantityGrams || 0) / 100;
    total.calories += factor * Number(item.nutritionPer100g?.calories || 0);
    total.protein += factor * Number(item.nutritionPer100g?.proteinGrams || 0);
    return total;
  }, { calories: 0, protein: 0 });
}
