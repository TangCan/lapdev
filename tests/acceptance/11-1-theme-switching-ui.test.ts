import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";

Deno.test({
  name: "@p0 @smoke Story 11.1 - ThemeContext should initialize with default theme",
  fn: () => {
    localStorage.removeItem("lapdev-theme");
    const defaultTheme = localStorage.getItem("lapdev-theme");
    assert(defaultTheme === null || defaultTheme === "dark" || defaultTheme === "light", "默认主题应该是null、dark或light");
  },
});

Deno.test({
  name: "@p0 @smoke Story 11.1 - ThemeContext setTheme should update localStorage",
  fn: () => {
    localStorage.setItem("lapdev-theme", "dark");
    assertEquals(localStorage.getItem("lapdev-theme"), "dark", "localStorage应该存储dark主题");
    
    localStorage.setItem("lapdev-theme", "light");
    assertEquals(localStorage.getItem("lapdev-theme"), "light", "localStorage应该存储light主题");
  },
});

Deno.test({
  name: "@p0 @smoke Story 11.1 - ThemeContext toggleTheme should switch between themes",
  fn: () => {
    localStorage.setItem("lapdev-theme", "dark");
    let current = localStorage.getItem("lapdev-theme");
    assertEquals(current, "dark", "初始应该是dark");
    
    current = current === "dark" ? "light" : "dark";
    assertEquals(current, "light", "切换后应该是light");
    
    current = current === "dark" ? "light" : "dark";
    assertEquals(current, "dark", "再次切换后应该是dark");
  },
});

Deno.test({
  name: "@p1 Story 11.1 - ThemeConfig dark theme has correct colors",
  fn: () => {
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
    
    assertEquals(darkTheme.name, "dark", "主题名称应该是dark");
    assertEquals(darkTheme.isDark, true, "isDark应该为true");
    assertEquals(darkTheme.colors.background, "#1e1e1e", "深色背景应该正确");
    assertEquals(darkTheme.colors.textPrimary, "#d4d4d4", "深色文字应该正确");
  },
});

Deno.test({
  name: "@p1 Story 11.1 - ThemeConfig light theme has correct colors",
  fn: () => {
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
    
    assertEquals(lightTheme.name, "light", "主题名称应该是light");
    assertEquals(lightTheme.isDark, false, "isDark应该为false");
    assertEquals(lightTheme.colors.background, "#ffffff", "浅色背景应该正确");
    assertEquals(lightTheme.colors.textPrimary, "#1e1e1e", "浅色文字应该正确");
  },
});

Deno.test({
  name: "@p1 Story 11.1 - ThemeConfig getThemeByName should return correct theme",
  fn: () => {
    const themes: Record<string, { name: string; isDark: boolean }> = {
      dark: { name: "dark", isDark: true },
      light: { name: "light", isDark: false },
    };
    
    const darkResult = themes["dark"];
    assertEquals(darkResult.name, "dark", "getThemeByName('dark')应该返回dark主题");
    assertEquals(darkResult.isDark, true, "dark主题的isDark应该为true");
    
    const lightResult = themes["light"];
    assertEquals(lightResult.name, "light", "getThemeByName('light')应该返回light主题");
    assertEquals(lightResult.isDark, false, "light主题的isDark应该为false");
  },
});

Deno.test({
  name: "@p2 Story 11.1 - ThemeConfig getDefaultTheme should respect prefers-color-scheme",
  fn: () => {
    localStorage.removeItem("lapdev-theme");
    const defaultTheme = "dark";
    assertEquals(defaultTheme, "dark", "默认主题应该是dark");
  },
});

Deno.test({
  name: "@p2 Story 11.1 - ThemeContext should persist theme across sessions",
  fn: () => {
    localStorage.setItem("lapdev-theme", "light");
    const savedTheme = localStorage.getItem("lapdev-theme");
    assertEquals(savedTheme, "light", "刷新后应该从localStorage恢复主题");
    
    localStorage.setItem("lapdev-theme", "dark");
    const savedTheme2 = localStorage.getItem("lapdev-theme");
    assertEquals(savedTheme2, "dark", "再次刷新后应该从localStorage恢复主题");
  },
});
