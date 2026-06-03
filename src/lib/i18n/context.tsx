"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { TranslationKeys } from "./types"
import { en } from "./en"
import { ar } from "./ar"

type Locale = "en" | "ar"

interface I18nContextValue {
  locale: Locale
  t: TranslationKeys
  setLocale: (l: Locale) => void
  dir: "ltr" | "rtl"
}

const translations: Record<Locale, TranslationKeys> = { en, ar }

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: en,
  setLocale: () => {},
  dir: "ltr",
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("padel-locale") as Locale | null
    if (stored && (stored === "en" || stored === "ar")) {
      setLocaleState(stored)
      document.documentElement.dir = stored === "ar" ? "rtl" : "ltr"
      document.documentElement.lang = stored
    }
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem("padel-locale", l)
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = l
  }

  const value: I18nContextValue = {
    locale,
    t: translations[locale],
    setLocale,
    dir: locale === "ar" ? "rtl" : "ltr",
  }

  if (!mounted) {
    return <I18nContext.Provider value={{ locale: "en", t: en, setLocale, dir: "ltr" }}>{children}</I18nContext.Provider>
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useLocale() {
  return useContext(I18nContext)
}
