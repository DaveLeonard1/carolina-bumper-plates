"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TopBar } from "@/components/top-bar"
import { Header } from "@/components/header"
import { BatchProgress } from "@/components/batch-progress"
import ProductConfigurator from "@/components/product-configurator"

export default function HomePage() {

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Hero Section with Transparent Header */}
      <section
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leonardd623_A_crossfit_gym_with_a_pile_of_rubber_bumper_plates__1f8a2f9c-db53-4057-b738-867222a79209.png-t4MLv5CT4WycwSqGRtxF7JmpvsoHMG.jpeg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Transparent Header */}
        <Header transparent />

        <div className="px-[27px] md:px-[52px] w-full">
          <div className="max-w-[1440px] mx-auto text-center text-white">
            <h1 className="text-6xl lg:text-8xl font-black mb-6 leading-tight">OFFICIAL HI-TEMP PLATES.</h1>
            <h2 className="text-3xl lg:text-4xl font-bold mb-12 opacity-90">MINOR BLEMISHES. MAJOR SAVINGS.</h2>
            <Button
              size="lg"
              onClick={() => {
                document.getElementById('configurator')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="font-bold text-xl px-12 py-6 text-black hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#B9FF16" }}
            >
              Build Your Set →
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ backgroundColor: "#1a1a1a" }}>
        <div className="px-[27px] md:px-[52px] py-[60px] md:py-[80px]">
          <div className="max-w-[1440px] mx-auto">
            <h2 className="text-4xl lg:text-5xl font-black text-center mb-12 text-white">HOW IT WORKS</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white rounded-3xl p-8">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-black mb-4 text-gray-900 flex items-center gap-3">
                    <span className="text-4xl">🏋🏽</span>
                    BUILD YOUR PREORDER
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Choose your plates and set up your preorder. No payment yet — just reserve your spot.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-3xl p-8">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-black mb-4 text-gray-900 flex items-center gap-3">
                    <span className="text-4xl">💳</span>
                    PAY WHEN READY
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Once we hit the weight goal, you'll receive a secure Stripe payment link. Only pay when your
                    preorder is confirmed.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-3xl p-8">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-black mb-4 text-gray-900 flex items-center gap-3">
                    <span className="text-4xl">📦</span>
                    DELIVERED TO YOU
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    We deliver your plates straight to you. Fast, local delivery once production is complete.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Product Configurator */}
      <ProductConfigurator />

      {/* Batch Progress */}
      <BatchProgress />
    </div>
  )
}
