'use client'

import Navigation from './Navigation'
import Hero from './Hero'
import FeaturesSection from './FeaturesSection'
import HowItWorksSection from './HowItWorksSection'
import StatsSection from './StatsSection'
import FAQSection from './FAQSection'
import CTASection from './CTASection'
import Footer from './Footer'

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      <Navigation />
      <Hero />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
