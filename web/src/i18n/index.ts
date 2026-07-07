import en from "./en.json";
import es from "./es.json";

export const messages: Record<string, typeof en> = { en, es };
export const defaultLocale = "en";
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

// Simple ICU-style plural formatter
export function formatPlural(template: string, values: Record<string, number>): string {
  return Object.entries(values).reduce((result, [key, count]) => {
    const pluralRegex = new RegExp(`\\{${key},\\s*plural,\\s*([^}]+(?:\\{[^}]*\\}[^}]*)*)\\}`, "g");
    return result.replace(pluralRegex, (_, rules: string) => {
      // Parse plural rules: =0 {text} =1 {text} other {text}
      const exactMatch = rules.match(new RegExp(`=${count}\\s*\\{([^}]*)\\}`));
      if (exactMatch) return exactMatch[1].replace("#", String(count));

      const otherMatch = rules.match(/other\s*\{([^}]*)\}/);
      if (otherMatch) return otherMatch[1].replace("#", String(count));

      return String(count);
    });
  }, template);
}
