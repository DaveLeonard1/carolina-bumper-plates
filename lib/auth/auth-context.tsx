"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { isAdmin } from "./admin"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  clearAllData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setIsAdminUser(isAdmin(currentUser))
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setIsAdminUser(isAdmin(currentUser))
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return {}
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdminUser(false)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return {}
  }

  const clearAllData = async () => {
    try {
      // Sign out first
      await supabase.auth.signOut({ scope: "global" })

      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()

      // Reset user state
      setUser(null)
      setIsAdminUser(false)

      console.log("All auth data cleared")
    } catch (error) {
      console.error("Error clearing auth data:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: isAdminUser,
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearAllData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
