export type ThemePreference = "dark" | "light";
export type LanguagePreference = "es" | "en";

export const getNextTheme = (theme: ThemePreference): ThemePreference =>
  theme === "light" ? "dark" : "light";

export const getNextLanguage = (language: string): LanguagePreference =>
  language.startsWith("es") ? "en" : "es";

export const applyThemePreference = (
  theme: ThemePreference,
  storage: Pick<Storage, "setItem"> = localStorage,
  body: { classList: Pick<DOMTokenList, "toggle"> } = document.body,
) => {
  storage.setItem("theme", theme);
  body.classList.toggle("light-mode", theme === "light");
};

export const readThemePreference = (
  storage: Pick<Storage, "getItem"> = localStorage,
): ThemePreference => (storage.getItem("theme") === "light" ? "light" : "dark");
