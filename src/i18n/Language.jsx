import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import english from './en.json';
import {
  createTranslator,
  LANGUAGE_STORAGE_KEY,
  readLanguage,
  SUPPORTED_LANGUAGES,
} from './locale';

export const LanguageContext = createContext({ language: 'ru', t: (value) => value });

export function LanguageProvider({ children }) {
  const [language, updateLanguage] = useState(() => {
    let storage;
    try {
      storage = window.localStorage;
    } catch {}
    return readLanguage(
      storage,
      navigator.languages?.length ? navigator.languages : [navigator.language],
    );
  });
  const value = useMemo(
    () => ({
      language,
      t: createTranslator(language, english),
      setLanguage(next) {
        if (!SUPPORTED_LANGUAGES.includes(next)) return;
        updateLanguage(next);
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
        } catch {}
      },
    }),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language, value]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  return useContext(LanguageContext);
}
