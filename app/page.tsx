"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, Truck, User } from "lucide-react"
import { colors, colorUsage } from "@/lib/colors"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import ProductConfigurator from "@/components/product-configurator"

export default function HomePage() {
  const { user, loading } = useAuth()
  const [faqs, setFaqs] = useState([
    {
      q: "Are these plates really Hi-Temp?",
      a: "Yes — all plates are official Hi-Temp USA-made bumper plates. They're just discounted due to minor visual defects.",
    },
    {
      q: "Why are they cheaper?",
      a: "These are factory seconds with small blemishes — not structural defects. Same durability, less cost.",
    },
    {
      q: "When do I pay?",
      a: "You'll receive an invoice once we reach our batch goal. No payment required until then.",
    },
    {
      q: "How does delivery work?",
      a: "We deliver on our return route after picking up from Hi-Temp. You'll get notified in advance.",
    },
    {
      q: "Can I change or cancel my preorder?",
      a: "Yes — you can make changes anytime before your invoice is sent.",
    },
  ])

  const [faqStates, setFaqStates] = useState(faqs.map(() => false))

  const currentProgress = 8320
  const targetWeight = 10000
  const progressPercentage = (currentProgress / targetWeight) * 100

  const toggleFaq = (index: number) => {
    setFaqStates((prev) => prev.map((state, i) => (i === index ? !state : state)))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorUsage.backgroundPrimary }}>
      {/* Header */}
      <header className="border-b px-4 py-4" style={{ borderColor: colorUsage.border }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8" style={{ color: colorUsage.textPrimary }} />
            <span className="text-xl font-bold">CAROLINA BUMPER PLATES</span>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <Link href="/my-account">
                    <Button variant="outline" className="font-semibold">
                      <User className="h-4 w-4 mr-2" />
                      My Account
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/order-lookup">
                      <Button variant="outline" className="font-semibold">
                        Find My Order
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" className="font-semibold">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
            <Link href="/contact">
              <Button variant="outline" className="font-semibold">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16" style={{ backgroundColor: colorUsage.backgroundDark }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center" style={{ color: colorUsage.textOnDark }}>
            <h1
              className="text-5xl md:text-7xl font-black mb-6 tracking-tight"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              OFFICIAL HI-TEMP PLATES.
              <br />
              MINOR BLEMISHES.
              <br />
              MAJOR SAVINGS.
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Factory-second bumper plates made in the USA by Hi-Temp — with small cosmetic flaws and serious
              performance.
            </p>
            <a href="#configurator">
              <Button
                size="lg"
                className="font-bold text-lg px-8 py-4"
                style={{
                  backgroundColor: colorUsage.buttonPrimary,
                  color: colorUsage.textOnAccent,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colorUsage.buttonPrimaryHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colorUsage.buttonPrimary)}
              >
                BUILD YOUR SET →
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* USA Made Section */}
      <section className="px-4 py-16" style={{ backgroundColor: colorUsage.backgroundLight }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: "Oswald, sans-serif" }}>
              USA-MADE. DISCOUNTED.
            </h2>
            <p className="text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: colorUsage.textMuted }}>
              We sell official Hi-Temp bumper plates with visual imperfections at discounted prices. These aren't
              knockoffs — they're the same plates trusted by gyms across the country, just with small scuffs or cosmetic
              inconsistencies.
            </p>
            <p className="text-xl font-semibold mt-6" style={{ color: colorUsage.textOnLight }}>
              You only pay when the next batch is ready.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-12"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            HOW IT WORKS
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 rounded-lg border">
              <CardContent className="pt-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colorUsage.buttonSecondary }}
                >
                  <span className="text-2xl font-bold" style={{ color: colorUsage.textOnDark }}>
                    1
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">BUILD YOUR SET</h3>
                <p style={{ color: colorUsage.textMuted }}>
                  Choose the plate sizes and quantities you want. Submit your preorder — no payment up front.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 rounded-lg border">
              <CardContent className="pt-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colorUsage.buttonSecondary }}
                >
                  <span className="text-2xl font-bold" style={{ color: colorUsage.textOnDark }}>
                    2
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">WE HIT 10,000 LBS</h3>
                <p style={{ color: colorUsage.textMuted }}>
                  When we reach 10,000 lbs in total preorders, we schedule our pickup with Hi-Temp.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 rounded-lg border">
              <CardContent className="pt-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colorUsage.buttonSecondary }}
                >
                  <Truck className="h-8 w-8" style={{ color: colorUsage.textOnDark }} />
                </div>
                <h3 className="text-xl font-bold mb-3">YOU GET DELIVERY</h3>
                <p style={{ color: colorUsage.textMuted }}>
                  We pick up the batch and deliver locally on our return route. Simple, fast, and cheaper for everyone.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Configurator */}
      <ProductConfigurator />

      {/* Progress Tracker */}
      <section className="px-4 py-16" style={{ backgroundColor: colorUsage.backgroundDark }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center" style={{ color: colorUsage.textOnDark }}>
            <h2 className="text-4xl md:text-5xl font-black mb-8" style={{ fontFamily: "Oswald, sans-serif" }}>
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
                      backgroundColor: colorUsage.accent,
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

      {/* FAQ */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-black text-center mb-12"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="rounded-lg border">
                <CardContent className="p-0">
                  <button
                    className="w-full text-left p-6 flex justify-between items-center transition-colors"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={faqStates[index]}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colorUsage.backgroundLight)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <h3 className="text-xl font-bold pr-4">{faq.q}</h3>
                    <div
                      className={`transform transition-transform duration-200 ${faqStates[index] ? "rotate-180" : ""}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {faqStates[index] && (
                    <div className="px-6 pb-6">
                      <p style={{ color: colorUsage.textMuted }}>{faq.a}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <Card className="p-6 rounded-lg border" style={{ backgroundColor: colorUsage.backgroundLight }}>
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-bold mb-3">Still have questions?</h3>
                <p style={{ color: colorUsage.textMuted }}>
                  Email us at{" "}
                  <a
                    href="mailto:info@carolinabumperplates.com"
                    className="font-semibold"
                    style={{ color: colorUsage.textOnLight }}
                  >
                    info@carolinabumperplates.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16" style={{ backgroundColor: colorUsage.backgroundAccent }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center" style={{ color: colorUsage.textOnAccent }}>
            <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: "Oswald, sans-serif" }}>
              READY TO LIFT?
            </h2>
            <p className="text-xl mb-8 font-semibold">
              Get the same plates for less. Submit your preorder today — no payment required.
            </p>
            <Link href="/checkout">
              <Button
                size="lg"
                className="font-bold text-lg px-8 py-4"
                style={{
                  backgroundColor: colorUsage.buttonDark,
                  color: colorUsage.textOnDark,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colorUsage.buttonDarkHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colorUsage.buttonDark)}
              >
                BUILD MY SET →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-4 py-8"
        style={{ backgroundColor: colorUsage.backgroundDark, color: colorUsage.textOnDark }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="h-6 w-6" />
            <span className="font-bold">CAROLINA BUMPER PLATES</span>
          </div>
          <p className="text-gray-400">Official Hi-Temp factory seconds. USA-made quality at wholesale prices.</p>
        </div>
      </footer>
    </div>
  )
}
