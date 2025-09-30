"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface HeaderProps {
  transparent?: boolean
}

export function Header({ transparent = false }: HeaderProps) {
  const bgColor = transparent ? "bg-transparent" : "bg-[#1a1a1a]"
  const position = transparent ? "absolute" : "relative"

  return (
    <header className={`${position} top-0 left-0 right-0 z-50 ${bgColor}`}>
      <div className="px-[27px] md:px-[52px] py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/plate-yard-logo-white.svg"
              alt="The Plate Yard"
              width={180}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Link href="/my-account">
              <Button variant="ghost" className="text-white hover:bg-white/10 font-semibold">
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
          </div>
        </div>
      </div>
    </header>
  )
}
