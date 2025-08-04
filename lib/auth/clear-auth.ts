"use client"

import { supabase } from "@/lib/supabase/client"

export async function clearAllAuthData() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut()

    // Clear all localStorage
    localStorage.clear()

    // Clear all sessionStorage
    sessionStorage.clear()

    // Clear any Supabase-specific storage
    const supabaseKeys = Object.keys(localStorage).filter(
      (key) => key.startsWith("sb-") || key.includes("supabase") || key.includes("auth"),
    )

    supabaseKeys.forEach((key) => {
      localStorage.removeItem(key)
    })

    // Clear cookies (if any)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })

    console.log("All auth data cleared successfully")
    return true
  } catch (error) {
    console.error("Error clearing auth data:", error)
    return false
  }
}

export async function forceSignOut() {
  try {
    // Force sign out and clear all sessions
    await supabase.auth.signOut({ scope: "global" })

    // Clear browser storage
    await clearAllAuthData()

    // Reload the page to reset all state
    window.location.reload()
  } catch (error) {
    console.error("Error during force sign out:", error)
    // Still reload even if there's an error
    window.location.reload()
  }
}
