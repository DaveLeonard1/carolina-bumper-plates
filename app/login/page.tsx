"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dumbbell, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/page-layout"

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
    <PageLayout>
      <div className="px-4 py-8" style={{ backgroundColor: colorUsage.backgroundLight }}>
        <div className="max-w-md mx-auto">
          <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
            <CardContent className="pt-6">
              <h1 className="text-3xl font-black mb-2 text-center" style={{ fontFamily: "Oswald, sans-serif" }}>
                SIGN IN
              </h1>
              <p className="mb-8 text-center" style={{ color: colorUsage.textMuted }}>
                Access your account to manage orders and profile
              </p>

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
                  className="w-full font-bold text-lg py-4"
                  disabled={isLoading || !formData.email || !formData.password}
                  style={{
                    backgroundColor:
                      !isLoading && formData.email && formData.password
                        ? colorUsage.buttonSecondary
                        : colorUsage.textDisabled,
                    color: colorUsage.textOnDark,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && formData.email && formData.password) {
                      e.currentTarget.style.backgroundColor = colorUsage.buttonSecondaryHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && formData.email && formData.password) {
                      e.currentTarget.style.backgroundColor = colorUsage.buttonSecondary
                    }
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
                  <Link href="/register" className="underline" style={{ color: colorUsage.textOnLight }}>
                    Create one here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
