/* This file intentionally exports the provider component plus the useLocale hook —
   they share one private context, so keeping them together is clearer than splitting.
   That trips the Fast-Refresh-only-components lint rule, which we opt out of here. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { strings } from './strings';

const LocaleContext = createContext(null);

const STORAGE_KEY = 'mgb-locale';

function getInitialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'mr') return saved;
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  return 'en';
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore persistence failures */
    }
  }, [locale]);

  const setLocale = useCallback((next) => {
    setLocaleState(next === 'mr' ? 'mr' : 'en');
  }, []);

  // t(key) → string. t(key, { name }) interpolates {name} placeholders.
  const t = useCallback(
    (key, params) => {
      const table = strings[locale] || strings.en;
      let str = table[key] ?? strings.en[key] ?? key;
      if (params) {
        str = str.replace(/\{(\w+)\}/g, (_, k) =>
          params[k] != null ? params[k] : `{${k}}`,
        );
      }
      return str;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}
