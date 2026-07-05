import React from 'react'
import Navbar from './landing/Navbar'
import HeroSection from './landing/HeroSection'
import PortalCards from './landing/PortalCards'
import WorkflowSection from './landing/WorkflowSection'
import FeaturesSection from './landing/FeaturesSection'
import Footer from './landing/Footer'

const LandingPage = () => {
  const handleScrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between select-text">
      <Navbar onScrollTo={handleScrollTo} />
      <main className="flex-grow">
        <HeroSection onScrollTo={handleScrollTo} />
        <PortalCards />
        <WorkflowSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage