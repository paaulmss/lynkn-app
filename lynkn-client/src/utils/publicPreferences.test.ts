import { describe, expect, it, vi } from "vitest";
import {
  applyThemePreference,
  getNextLanguage,
  getNextTheme,
  readThemePreference,
} from "./publicPreferences";

describe("public preferences", () => {
  it("alternates theme values", () => {
    expect(getNextTheme("dark")).toBe("light");
    expect(getNextTheme("light")).toBe("dark");
  });

  it("alternates supported language values", () => {
    expect(getNextLanguage("es")).toBe("en");
    expect(getNextLanguage("es-ES")).toBe("en");
    expect(getNextLanguage("en")).toBe("es");
  });

  it("stores and applies light theme", () => {
    const storage = { setItem: vi.fn() };
    const body = { classList: { toggle: vi.fn() } };

    applyThemePreference("light", storage, body);

    expect(storage.setItem).toHaveBeenCalledWith("theme", "light");
    expect(body.classList.toggle).toHaveBeenCalledWith("light-mode", true);
  });

  it("reads dark as the default theme", () => {
    const storage = { getItem: vi.fn(() => null) };
    expect(readThemePreference(storage)).toBe("dark");
  });
});
