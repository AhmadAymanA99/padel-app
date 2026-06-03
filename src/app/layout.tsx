import type { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"
import { Providers } from "./providers"
import { Header } from "./header"
import { Footer } from "./footer"

export const metadata: Metadata = {
  title: "Padel Tournament Manager",
  description: "Manage padel tournaments - leagues, cups, and free-for-all",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-6">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
