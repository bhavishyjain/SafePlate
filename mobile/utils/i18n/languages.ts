import en from "../../assets/lang/english.json";
import hi from "../../assets/lang/hindi.json";

export const LANGUAGES = {
  en: {
    label: "English",
    messages: en,
    value: "en",
  },
  hi: {
    label: "हिन्दी",
    messages: hi,
    value: "hi",
  },
} as const;

export type LanguageKey = keyof typeof LANGUAGES;
