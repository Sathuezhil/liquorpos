import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

const STORAGE_KEY = 'liquorpos_lang'

const I18nContext = createContext(null)

function interpolate(template, vars = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : '',
  )
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'fr' ? 'fr' : 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => {
    function setLang(next) {
      setLangState(next === 'fr' ? 'fr' : 'en')
    }

    function t(key, vars) {
      const table = translations[lang] || translations.en
      const text = table[key] ?? translations.en[key] ?? key
      return vars ? interpolate(text, vars) : text
    }

    return { lang, setLang, t, locale: lang === 'fr' ? 'fr-FR' : 'en-US' }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
