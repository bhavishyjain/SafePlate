const INDIA_OFFSET_MILLISECONDS = 5.5 * 60 * 60 * 1000;
const indiaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function startOfOperationalDay(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("A valid date is required");
  }
  const parts = Object.fromEntries(
    indiaDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day) - INDIA_OFFSET_MILLISECONDS
  );
}

export function isExpired(deadline, evaluatedAt = new Date()) {
  return new Date(deadline).getTime() <= new Date(evaluatedAt).getTime();
}
