import { createContext, useState, useEffect, useContext } from "react";
import en from "../locales/en.json";
import te from "../locales/te.json";

const LanguageContext = createContext();

const dictionaries = { en, te };

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    // 1. Check local storage
    const saved = localStorage.getItem("locale");
    if (saved === "en" || saved === "te") return saved;

    // 2. Check browser preferences
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.startsWith("te")) {
      return "te";
    }
    return "en";
  });

  // Load fonts and apply class on mount/change
  useEffect(() => {
    let fontLink = document.getElementById("google-font-telugu");
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "google-font-telugu";
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;700;900&display=swap";
      document.head.appendChild(fontLink);
    }

    if (locale === "te") {
      document.body.classList.add("font-telugu");
      document.body.style.fontFamily = "'Noto Sans Telugu', system-ui, sans-serif";
    } else {
      document.body.classList.remove("font-telugu");
      document.body.style.fontFamily = ""; // Fallback to Inter/Manrope
    }

    localStorage.setItem("locale", locale);
  }, [locale]);

  // Nested translation helper (e.g. t('nav.home'))
  const t = (keyPath) => {
    const keys = keyPath.split(".");
    let current = dictionaries[locale];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English dictionary if not found in current dictionary
        let fallback = dictionaries["en"];
        for (const fKey of keys) {
          if (fallback && fallback[fKey] !== undefined) {
            fallback = fallback[fKey];
          } else {
            return keyPath; // return the path key if missing entirely
          }
        }
        return fallback;
      }
    }
    return current;
  };

  const changeLanguage = (newLocale) => {
    if (newLocale === "en" || newLocale === "te") {
      setLocale(newLocale);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, t, changeLanguage }}>
      <div className={`transition-opacity duration-300`}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
