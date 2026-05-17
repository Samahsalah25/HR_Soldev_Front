import { useState, useEffect } from "react";

const LANG_KEY = "hr_system_lang";

export function useLanguage() {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || "ar");

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang(l => l === "ar" ? "en" : "ar");

  return { lang, setLang, toggle, isAr: lang === "ar" };
}