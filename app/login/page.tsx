"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { BatchProgress } from "@/components/batch-progress"
import { TopBar } from "@/components/top-bar"
import { Header } from "@/components/header"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { signIn } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("") // Clear error when user starts typing
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn(formData.email, formData.password)

      if (result.error) {
        setError(result.error)
      } else {
        // Successful login - redirect to My Account
        console.log("Login successful, redirecting to My Account")
        router.push("/my-account")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <Header />
      <main>
        <div className="bg-gray-50">
            <div className="px-4 py-8 md:py-16">
              <div className="max-w-4xl mx-auto">
                <div className="text-center">
                  <h1
                    className="text-4xl md:text-5xl font-black mb-4"
                    style={{ fontFamily: "Oswald, sans-serif", color: "#1a1a1a" }}
                  >
                    SIGN IN
                  </h1>
                  <p className="text-xl" style={{ color: "#1a1a1a" }}>
                    Access your account to manage orders and profile
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
                  <div className="bg-black text-white p-4">
                    <h3 className="text-xl font-black text-center" style={{ fontFamily: "Oswald, sans-serif" }}>
                      LOGIN TO YOUR ACCOUNT
                    </h3>
                  </div>
                  <div className="p-6">
                    {error && (
                      <div className="flex items-start gap-3 p-4 rounded-lg mb-6" style={{ backgroundColor: "#fef2f2" }}>
                        <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                          className="mt-1"
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative mt-1">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            required
                            className="pr-10"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full font-black text-lg py-4"
                        disabled={isLoading || !formData.email || !formData.password}
                        style={{
                          backgroundColor:
                            !isLoading && formData.email && formData.password
                              ? "#B9FF16"
                              : colorUsage.textDisabled,
                          color: "#000",
                          fontFamily: "Oswald, sans-serif"
                        }}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Signing In...
                          </div>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>

                    <div className="mt-6 text-center">
                      <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                        Don't have an account?{" "}
                        <Link href="/register" className="underline font-bold" style={{ color: "#1a1a1a" }}>
                          Create one here
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <BatchProgress />
          </div>
      </main>
    </div>
  )
}
