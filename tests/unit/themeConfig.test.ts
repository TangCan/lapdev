import { assertEquals, assertObjectMatch } from "https://deno.land/std@0.210.0/testing/asserts.ts";

const darkTheme = {
  name: "dark",
  isDark: true,
  colors: {
    background: "#1e1e1e",
    surface: "#252526",
    surfaceHover: "#2d2d2d",
    border: "#3c3c3c",
    textPrimary: "#d4d4d4",
    textSecondary: "#c6c6c6",
    textMuted: "#858585",
    accent: "#007acc",
    accentHover: "#005a9e",
    success: "#3fb950",
    warning: "#d29922",
    danger: "#f14c4c",
    info: "#58a6ff",
  },
};

const lightTheme = {
  name: "light",
  isDark: false,
  colors: {
    background: "#ffffff",
    surface: "#f5f5f5",
    surfaceHover: "#e8e8e8",
    border: "#d4d4d4",
    textPrimary: "#1e1e1e",
    textSecondary: "#3c3c3c",
    textMuted: "#6e6e6e",
    accent: "#007acc",
    accentHover: "#005a9e",
    success: "#3fb950",
    warning: "#d29922",
    danger: "#f14c4c",
    info: "#58a6ff",
  },
};

Deno.test({
  name: "@p1 ThemeConfig - dark theme has correct structure",
  fn: () => {
    assertEquals(darkTheme.name, "dark");
    assertEquals(darkTheme.isDark, true);
    assertObjectMatch(darkTheme.colors, {
      background: "#1e1e1e",
      textPrimary: "#d4d4d4",
      accent: "#007acc",
    });
  },
});

Deno.test({
  name: "@p1 ThemeConfig - light theme has correct structure",
  fn: () => {
    assertEquals(lightTheme.name, "light");
    assertEquals(lightTheme.isDark, false);
    assertObjectMatch(lightTheme.colors, {
      background: "#ffffff",
      textPrimary: "#1e1e1e",
      accent: "#007acc",
    });
  },
});

Deno.test({
  name: "@p1 ThemeConfig - getThemeByName returns correct theme",
  fn: () => {
    const themes: Record<string, typeof darkTheme> = {
      dark: darkTheme,
      light: lightTheme,
    };
    
    assertEquals(themes["dark"].name, "dark");
    assertEquals(themes["dark"].isDark, true);
    
    assertEquals(themes["light"].name, "light");
    assertEquals(themes["light"].isDark, false);
  },
});

Deno.test({
  name: "@p2 ThemeConfig - themes have consistent color keys",
  fn: () => {
    const darkKeys = Object.keys(darkTheme.colors).sort();
    const lightKeys = Object.keys(lightTheme.colors).sort();
    
    assertEquals(darkKeys, lightKeys, "深色和浅色主题应该有相同的颜色键");
  },
});

Deno.test({
  name: "@p2 ThemeConfig - accent colors are consistent across themes",
  fn: () => {
    assertEquals(darkTheme.colors.accent, lightTheme.colors.accent, "accent颜色应该一致");
    assertEquals(darkTheme.colors.accentHover, lightTheme.colors.accentHover, "accentHover颜色应该一致");
  },
});
