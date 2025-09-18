"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { colors, colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import ProductConfigurator from "@/components/product-configurator"

export default function HomePage() {
  const { user, loading } = useAuth()
  // Homepage metrics

  const currentProgress = 8320
  const targetWeight = 10000
  const progressPercentage = (currentProgress / targetWeight) * 100

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
      {/* Hero + Nav (overlay) */}
      <section className="relative h-[650px] overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url('/images/style-reference-1.webp')" }}
        />
        <div className="absolute inset-0 opacity-60" style={{ backgroundColor: "var(--carolina-bumper-plates-black-600)" }} />

        {/* Top bars */}
        <div className="absolute top-0 left-0 right-0">
          {/* Shipping bar */}
          <div className="hidden md:flex items-center justify-start px-[52px] py-3 h-12 text-white/90 text-sm">
            <span>Free delivery on every order</span>
          </div>
          {/* Main nav */}
          <div className="flex items-center justify-between px-[57px] py-2 border-b border-transparent">
            <div className="flex items-center">
              <img
                src="/The-Plate-Yard_Logo.svg"
                alt="The Plate Yard"
                className="w-[200px] h-[40.08px]"
              />
            </div>
            <div className="flex items-center gap-[30px]">
                {!loading && (
                  <>
                    {user ? (
                      <Link href="/my-account">
                        <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                          <User className="h-4 w-4 mr-2" />
                          My Account
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/order-lookup">
                          <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                            Find My Order
                          </Button>
                        </Link>
                        <Link href="/login">
                          <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                            Sign In
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
                <Link href="/contact">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          
        </div>

        {/* Hero copy */}
        <div className="relative z-10 flex h-full items-center justify-center">
          <div className="text-center text-white px-6">
            <h1
              className="font-heading mb-2 text-[length:var(--san-serif-h2-font-size)] leading-[var(--san-serif-h2-line-height)] tracking-[var(--san-serif-h2-letter-spacing)] font-[number:var(--san-serif-h2-font-weight)]"
            >
              OFFICIAL HI-TEMP PLATES.
            </h1>
            <p className="font-heading mt-1 text-[length:var(--san-serif-h4-font-size)] leading-[var(--san-serif-h4-line-height)] tracking-[var(--san-serif-h4-letter-spacing)] font-[number:var(--san-serif-h4-font-weight)] uppercase">
              MINOR BLEMISHES.  MAJOR SAVINGS.
            </p>
            <a href="#configurator">
              <Button
                size="lg"
                className="mt-8 h-auto px-[55px] py-[15px] pb-[23px] bg-carolina-bumper-plates-lime-600 hover:bg-carolina-bumper-plates-lime-700 text-carolina-bumper-plates-black-600 font-heading text-[26px] leading-[38px] rounded-lg"
              >
                Build Your Set →
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* How It Works (dark) */}
      <section className="px-4 py-20 bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto text-white text-center">
          <h2 className="text-4xl md:text-5xl font-black uppercase">
            HOW IT WORKS
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="bg-white h-[250px] rounded-lg" />
            <div className="bg-white h-[250px] rounded-lg" />
            <div className="bg-white h-[250px] rounded-lg" />
          </div>
        </div>
      </section>

      {/* Product Configurator */}
      <section id="configurator">
        <ProductConfigurator />
      </section>

      {/* Batch Progress */}
      <section className="px-4 py-16" style={{ backgroundColor: colorUsage.backgroundDark }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center" style={{ color: colorUsage.textOnDark }}>
            <h2 className="text-4xl md:text-5xl font-black mb-8 uppercase">
              BATCH PROGRESS
            </h2>
            <div className="rounded-2xl p-8" style={{ backgroundColor: colorUsage.backgroundDark }}>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold">{currentProgress.toLocaleString()} lbs</span>
                  <span className="text-2xl font-bold">{targetWeight.toLocaleString()} lbs</span>
                </div>
                <div className="w-full rounded-full h-4" style={{ backgroundColor: colors.gray700 }}>
                  <div
                    className="h-4 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: "#cfff5e",
                      width: `${progressPercentage}%`,
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-xl font-semibold" style={{ color: colorUsage.accent }}>
                🔔 Only {(targetWeight - currentProgress).toLocaleString()} lbs to go before the next batch is
                fulfilled!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
