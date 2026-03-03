"use client";

import { useEffect, useState } from "react";
import { ThemeMode } from "@/types/enums";

const getThemeFromDom = (): ThemeMode => {
  if (typeof window === "undefined") return ThemeMode.Light;

  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === ThemeMode.Dark || attr === ThemeMode.Light) return attr;

  const saved = window.localStorage.getItem("theme");
  if (saved === ThemeMode.Dark || saved === ThemeMode.Light) return saved;

  return ThemeMode.Light;
};

export const useThemeMode = (): ThemeMode => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeFromDom);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setThemeMode(getThemeFromDom());

    syncTheme();

    const observer = new MutationObserver((mutations) => {
      const hasThemeMutation = mutations.some(
        (mutation) =>
          mutation.type === "attributes" && mutation.attributeName === "data-theme"
      );
      if (hasThemeMutation) syncTheme();
    });

    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("storage", syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
    };
  }, []);
  
  return themeMode;
};

