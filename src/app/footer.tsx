"use client"

import { useLocale } from "@/lib/i18n/context"

export function Footer() {
  const { t } = useLocale()

  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      <div className="container mx-auto px-4 space-y-1">
        <p>{t.app.footer}</p>
        <p>&copy; {new Date().getFullYear()} Padel Tournament Manager. All rights reserved.</p>
      </div>
    </footer>
  )
}
