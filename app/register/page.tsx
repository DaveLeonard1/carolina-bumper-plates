"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dumbbell, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

export default function RegisterPage() {
  const { signUp, loading } = useAuth()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsSubmitting(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsSubmitting(false)
      return
    }

    try {
      const result = await signUp(formData.email, formData.password, formData.fullName)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colorUsage.backgroundLight }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: colorUsage.textOnLight }}
          ></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
        <header
          className="border-b px-4 py-4"
          style={{ backgroundColor: colorUsage.backgroundPrimary, borderColor: colorUsage.border }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="h-8 w-8" style={{ color: colorUsage.textPrimary }} />
              <span className="text-xl font-bold">CAROLINA BUMPER PLATES</span>
            </Link>
          </div>
        </header>

        <div className="px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h1 className="text-2xl font-bold mb-4">Check Your Email!</h1>
                <p className="mb-6" style={{ color: colorUsage.textMuted }}>
                  We've sent you a confirmation email. Please click the link in the email to verify your account.
                </p>
                <Link href="/login">
                  <Button className="w-full" style={{ backgroundColor: colorUsage.buttonSecondary }}>
                    Back to Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundLight }}>
      {/* Header */}
      <header
        className="border-b px-4 py-4"
        style={{ backgroundColor: colorUsage.backgroundPrimary, borderColor: colorUsage.border }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8" style={{ color: colorUsage.textPrimary }} />
            <span className="text-xl font-bold">CAROLINA BUMPER PLATES</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline" className="font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="font-semibold">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
              CREATE ACCOUNT
            </h1>
            <p className="text-xl" style={{ color: colorUsage.textMuted }}>
              Join to manage your preorders easily
            </p>
          </div>

          <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    required
                    className="mt-1"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="mt-1"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      required
                      className="pr-10"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: "#fef2f2" }}>
                    <AlertCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold text-lg py-4"
                  disabled={
                    !formData.fullName ||
                    !formData.email ||
                    !formData.password ||
                    !formData.confirmPassword ||
                    isSubmitting
                  }
                  style={{
                    backgroundColor:
                      formData.fullName &&
                      formData.email &&
                      formData.password &&
                      formData.confirmPassword &&
                      !isSubmitting
                        ? colorUsage.buttonSecondary
                        : colorUsage.textDisabled,
                    color: colorUsage.textOnDark,
                  }}
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm" style={{ color: colorUsage.textMuted }}>
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold underline" style={{ color: colorUsage.textOnLight }}>
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
