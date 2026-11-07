'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, TRANSLATIONS, LanguageOption } from './translations';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageOption[];
  getAiLanguageInstruction: () => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  supportedLanguages: SUPPORTED_LANGUAGES,
  getAiLanguageInstruction: () => '',
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('evolyn_language') as SupportedLanguage | null;
      if (stored && ['en', 'en-simple', 'hi-latn', 'bn'].includes(stored)) {
        setLanguageState(stored);
        document.documentElement.lang = stored === 'bn' ? 'bn' : stored === 'hi-latn' ? 'hi' : 'en';
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('evolyn_language', newLang);
      document.documentElement.lang = newLang === 'bn' ? 'bn' : newLang === 'hi-latn' ? 'hi' : 'en';
      // Sync with evolyn_workspace_settings if present
      const wsSettings = localStorage.getItem('evolyn_workspace_settings');
      if (wsSettings) {
        const parsed = JSON.parse(wsSettings);
        parsed.selectedLanguage = newLang;
        localStorage.setItem('evolyn_workspace_settings', JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const langDict = TRANSLATIONS[language];
      if (langDict && langDict[key]) {
        return langDict[key];
      }
      // Fallback to English dict if missing in current language
      if (TRANSLATIONS.en && TRANSLATIONS.en[key]) {
        return TRANSLATIONS.en[key];
      }
      return fallback || key;
    },
    [language]
  );

  // Provides instructions to Gemini for review feedback, summaries, and suggestions
  const getAiLanguageInstruction = useCallback((): string => {
    switch (language) {
      case 'en-simple':
        return 'IMPORTANT: Write your review explanations, suggestions, and summaries in clear, simple English with minimal technical jargon. Preserve the original document content and brand names without translation.';
      case 'hi-latn':
        return 'IMPORTANT: Write your review explanations, rationale, and suggestions in natural conversational Hinglish (Roman Hindi written in English alphabet, e.g. "Yeh sentence brand guideline ke hisab se theek nahi hai"). Preserve the original document content, technical terms, and brand names.';
      case 'bn':
        return 'IMPORTANT: Write your review explanations, suggestions, and summaries in natural Bengali (বাংলা). Preserve exact brand names, approved facts, and original document language unless explicit translation is requested.';
      case 'en':
      default:
        return 'Write review explanations and suggestions in standard enterprise English.';
    }
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        getAiLanguageInstruction,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

