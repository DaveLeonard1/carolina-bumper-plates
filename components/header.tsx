"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useAuth } from "@/lib/auth/auth-context"
import { LogOut, Menu, X, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

interface HeaderProps {
  transparent?: boolean
}

export function Header({ transparent = false }: HeaderProps) {
  const bgColor = transparent ? "bg-transparent" : "bg-[#1a1a1a]"
  const position = transparent ? "absolute" : "relative"
  const { user, isAdmin, signOut } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    setMobileMenuOpen(false)
  }

  return (
    <header className={`${position} top-0 left-0 right-0 z-50 ${bgColor}`}>
      <div className="px-[27px] md:px-[52px] py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {/* Mobile Logo */}
            <Image
              src="/Plate-Yard_mobile.svg"
              alt="The Plate Yard"
              width={120}
              height={120}
              className="h-20 w-auto md:hidden"
              priority
            />
            {/* Desktop Logo */}
            <Image
              src="/plate-yard-logo-white.svg"
              alt="The Plate Yard"
              width={180}
              height={60}
              className="h-12 w-auto hidden md:block"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/my-account">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black font-semibold bg-transparent"
              >
                My Account
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black font-semibold bg-transparent"
              >
                Contact Us
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-semibold bg-transparent"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            {user && (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black font-semibold bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800">
          <div className="px-[27px] py-4 flex flex-col gap-3">
            <Link href="/my-account" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant="outline"
                className="w-full border-white text-white hover:bg-white hover:text-black font-semibold bg-transparent justify-start"
              >
                My Account
              </Button>
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant="outline"
                className="w-full border-white text-white hover:bg-white hover:text-black font-semibold bg-transparent justify-start"
              >
                Contact Us
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-semibold bg-transparent justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            {user && (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full border-white text-white hover:bg-white hover:text-black font-semibold bg-transparent justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
