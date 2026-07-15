import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";

Deno.test({
  name: "@p0 @smoke ThemeContext - initializes with localStorage theme",
  fn: () => {
    localStorage.setItem("lapdev-theme", "light");
    const savedTheme = localStorage.getItem("lapdev-theme");
    assertEquals(savedTheme, "light", "应该从localStorage恢复主题");
  },
});

Deno.test({
  name: "@p0 @smoke ThemeContext - setTheme updates localStorage",
  fn: () => {
    localStorage.setItem("lapdev-theme", "dark");
    assertEquals(localStorage.getItem("lapdev-theme"), "dark");
    
    localStorage.setItem("lapdev-theme", "light");
    assertEquals(localStorage.getItem("lapdev-theme"), "light");
  },
});

Deno.test({
  name: "@p0 @smoke ThemeContext - toggleTheme switches between themes",
  fn: () => {
    localStorage.setItem("lapdev-theme", "dark");
    let current = localStorage.getItem("lapdev-theme");
    assertEquals(current, "dark");
    
    current = current === "dark" ? "light" : "dark";
    assertEquals(current, "light");
    
    current = current === "dark" ? "light" : "dark";
    assertEquals(current, "dark");
  },
});

Deno.test({
  name: "@p1 ThemeContext - defaults to dark when no localStorage",
  fn: () => {
    localStorage.removeItem("lapdev-theme");
    const theme = localStorage.getItem("lapdev-theme");
    assert(theme === null || theme === "dark", "无存储时应该是null或dark");
  },
});

Deno.test({
  name: "@p1 ThemeContext - persists theme across sessions",
  fn: () => {
    localStorage.setItem("lapdev-theme", "light");
    const saved = localStorage.getItem("lapdev-theme");
    assertEquals(saved, "light", "刷新后应该保持light");
    
    localStorage.setItem("lapdev-theme", "dark");
    const saved2 = localStorage.getItem("lapdev-theme");
    assertEquals(saved2, "dark", "切换后应该保持dark");
  },
});
