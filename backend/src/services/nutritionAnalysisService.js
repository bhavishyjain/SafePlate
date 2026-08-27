import { NutritionCatalogItem } from "../models/NutritionCatalogItem.js";
import { getConfig } from "../config/env.js";

function normalize(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

function catalogMatch(name, catalog) {
  const target = normalize(name);
  return catalog.find((item) =>
    [item.name, ...(item.aliases || [])].some((candidate) => normalize(candidate) === target)
  );
}

function catalogSuggestion(input, match) {
  return {
    name: input.name.trim(),
    quantityGrams: input.quantityGrams,
    nutritionPer100g: { calories: match.caloriesPer100g, proteinGrams: match.proteinPer100g },
    baseShelfLifeHours: match.baseShelfLifeHours,
    nutritionSource: "CATALOG",
    catalogItemId: match._id,
    donorConfirmed: false,
    analysisStatus: "READY_FOR_CONFIRMATION",
  };
}

async function analyzeWithGemini(items) {
  const config = getConfig();
  if (!config.geminiApiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `Estimate nutrition per 100g and conservative cooked-food shelf life in hours for these food names: ${JSON.stringify(items.map((item) => item.name))}. Return values in the same order. Do not add commentary.` }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            required: ["name", "caloriesPer100g", "proteinPer100g", "baseShelfLifeHours"],
            properties: {
              name: { type: "STRING" },
              caloriesPer100g: { type: "NUMBER" },
              proteinPer100g: { type: "NUMBER" },
              baseShelfLifeHours: { type: "NUMBER" },
            },
          },
        },
      },
    }),
  });
  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
  const payload = await response.json();
  return JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
}

export async function analyzeNutritionItems(items) {
  const catalog = await NutritionCatalogItem.find({ active: true });
  const suggestions = new Array(items.length);
  const unmatched = [];
  items.forEach((input, index) => {
    const match = catalogMatch(input.name, catalog);
    if (match) suggestions[index] = catalogSuggestion(input, match);
    else unmatched.push({ input, index });
  });

  if (unmatched.length > 0) {
    let estimates = null;
    try { estimates = await analyzeWithGemini(unmatched.map(({ input }) => input)); }
    catch (error) { console.error("Gemini nutrition analysis unavailable:", error.message); }
    unmatched.forEach(({ input, index }, estimateIndex) => {
      const estimate = estimates?.[estimateIndex];
      suggestions[index] = estimate
        ? {
            name: input.name.trim(),
            quantityGrams: input.quantityGrams,
            nutritionPer100g: { calories: Math.max(0, estimate.caloriesPer100g), proteinGrams: Math.max(0, estimate.proteinPer100g) },
            baseShelfLifeHours: Math.max(0.1, estimate.baseShelfLifeHours),
            nutritionSource: "GEMINI_ESTIMATE",
            donorConfirmed: false,
            analysisStatus: "READY_FOR_CONFIRMATION",
          }
        : { ...input, analysisStatus: "UNAVAILABLE", message: "No catalog match was found and Gemini analysis is unavailable" };
    });
  }
  return suggestions;
}
