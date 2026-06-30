"use client"

import * as React from "react"
import { storage } from "@/lib/storage"

export type Theme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
}

type ThemeProviderState = {
  resolvedTheme: Theme
}

const ThemeProviderContext = React.createContext<ThemeProviderState>({
  resolvedTheme: "light"
})

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [resolvedTheme, setResolvedTheme] = React.useState<Theme>("light")
  const [isLoaded, setIsLoaded] = React.useState(false)

  // 1. Initial configuration, storage cleanup, and change listeners
  React.useEffect(() => {
    // Determine the system dark theme state immediately on mount
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setResolvedTheme(mediaQuery.matches ? "dark" : "light")
    setIsLoaded(true)

    // Clear old theme keys from localStorage and Capacitor Preferences
    const keysToClear = [
      "flow-ui-theme",
      "theme",
      "themeMode",
      "colorScheme",
      "glassMode",
      "selectedMode"
    ]

    if (typeof window !== "undefined" && window.localStorage) {
      keysToClear.forEach((k) => {
        try {
          window.localStorage.removeItem(k)
        } catch (e) {}
      })
    }

    keysToClear.forEach((k) => {
      storage.removeItem(k).catch(() => {})
    })

    // Listen for theme preference changes dynamically
    const listener = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? "dark" : "light")
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener)
    } else {
      mediaQuery.addListener(listener)
    }

    // Listen for app state change (resume from background)
    let appStateListener: any = null
    const setupAppListener = async () => {
      const { Capacitor } = await import("@capacitor/core")
      if (Capacitor.isNativePlatform()) {
        const { App } = await import("@capacitor/app")
        appStateListener = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            setResolvedTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          }
        })
      }
    }
    setupAppListener()

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", listener)
      } else {
        mediaQuery.removeListener(listener)
      }
      if (appStateListener) {
        appStateListener.remove()
      }
    }
  }, [])

  // 2. Synchronize layout classes with the resolved theme state
  React.useEffect(() => {
    if (!isLoaded) return
    const root = window.document.documentElement
    root.classList.remove("light", "dark", "glass")
    root.classList.add(resolvedTheme)
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme, isLoaded])

  const value = React.useMemo(() => ({
    resolvedTheme
  }), [resolvedTheme])

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
