"use client"

import { useLocale } from "@/lib/i18n/context"
import { useTheme } from "@/lib/theme/context"
import { Sun, Moon, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { t, locale, setLocale } = useLocale()
  const { theme, toggle } = useTheme()

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <a href="/" className="font-bold text-lg text-primary hover:text-primary/80 transition-colors">
          🎾 {t.app.title}
        </a>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setLocale(locale === "en" ? "ar" : "en")} className="gap-1.5" title={locale === "en" ? "العربية" : "English"}>
            <Languages className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{locale.toUpperCase()}</span>
          </Button>
          <Button variant="outline" size="icon" onClick={toggle} title={theme === "light" ? "Dark mode" : "Light mode"}>
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="sr-only">Theme</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
