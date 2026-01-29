'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { OnboardingOverlay } from './OnboardingOverlay'
import { OnboardingTooltip } from './OnboardingTooltip'
import { OnboardingWelcome } from './OnboardingWelcome'
import { OnboardingComplete } from './OnboardingComplete'

/**
 * DashboardOnboarding - Main orchestrator for the onboarding spotlight tour.
 *
 * Required data-onboarding attributes on target elements:
 * - data-onboarding="mic-button"
 * - data-onboarding="chat-bar"
 * - data-onboarding="view-toggle"
 * - data-onboarding="sidebar" (desktop only)
 * - data-onboarding="actions" (optional - only shown if element exists)
 */

const TOUR_STEPS = [
  {
    id: 'mic-button',
    selector: '[data-onboarding="mic-button"]',
    title: 'Record a voice note',
    description: 'Tap the mic to capture your thoughts. Just speak naturally — we\'ll handle the rest.',
    position: 'top'
  },
  {
    id: 'chat-bar',
    selector: '[data-onboarding="chat-bar"]',
    title: 'Meet Remy, your AI assistant',
    description: 'Ask questions about your notes, get summaries, or say "Hey Remy" to save important thoughts.',
    position: 'top'
  },
  {
    id: 'view-toggle',
    selector: '[data-onboarding="view-toggle"]',
    title: 'Switch your view',
    description: 'Toggle between your Notes list and Brain Dump for a synthesized overview of your ideas.',
    position: 'bottom'
  },
  {
    id: 'sidebar',
    selector: '[data-onboarding="sidebar"]',
    title: 'Organize with folders & tags',
    description: 'Create folders and tags to keep your notes organized. Click any to filter your view.',
    position: 'right',
    desktopOnly: true
  },
  {
    id: 'actions',
    selector: '[data-onboarding="actions"]',
    title: 'Your action items',
    description: 'Tasks and to-dos are automatically extracted from your notes and appear here.',
    position: 'bottom',
    optional: true // Skip if element doesn't exist (e.g., no todos for new users)
  }
]

export const DashboardOnboarding = ({
  userName,
  isOnboardingComplete,
  onComplete,
  onStartRecording
}) => {
  const [phase, setPhase] = useState('idle') // 'idle' | 'welcome' | 'tour' | 'complete'
  const [currentStep, setCurrentStep] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [availableElements, setAvailableElements] = useState({})

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check which target elements exist in the DOM
  useEffect(() => {
    if (phase === 'tour') {
      const checkElements = () => {
        const elements = {}
        TOUR_STEPS.forEach(step => {
          elements[step.id] = !!document.querySelector(step.selector)
        })
        setAvailableElements(elements)
      }
      // Check immediately and on any DOM changes
      checkElements()
      const observer = new MutationObserver(checkElements)
      observer.observe(document.body, { childList: true, subtree: true })
      return () => observer.disconnect()
    }
  }, [phase])

  // Filter steps: remove desktop-only on mobile, remove optional steps if element doesn't exist
  const activeSteps = useMemo(() => {
    return TOUR_STEPS.filter(step => {
      // Skip desktop-only steps on mobile
      if (step.desktopOnly && isMobile) return false
      // Skip optional steps if element doesn't exist
      if (step.optional && availableElements[step.id] === false) return false
      return true
    })
  }, [isMobile, availableElements])

  // Start onboarding if not complete
  useEffect(() => {
    if (!isOnboardingComplete && phase === 'idle') {
      // Small delay to let dashboard render
      const timer = setTimeout(() => setPhase('welcome'), 800)
      return () => clearTimeout(timer)
    }
  }, [isOnboardingComplete, phase])

  const handleStartTour = useCallback(() => {
    setPhase('tour')
    setCurrentStep(0)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setPhase('complete')
    }
  }, [currentStep, activeSteps.length])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    setPhase('idle')
    onComplete?.()
  }, [onComplete])

  const handleComplete = useCallback(() => {
    setPhase('idle')
    onComplete?.()
  }, [onComplete])

  const handleStartRecordingAndClose = useCallback(() => {
    setPhase('idle')
    onComplete?.()
    // Small delay to ensure modal closes first
    setTimeout(() => onStartRecording?.(), 300)
  }, [onComplete, onStartRecording])

  // Don't render if onboarding is already complete
  if (isOnboardingComplete && phase === 'idle') {
    return null
  }

  const currentTourStep = activeSteps[currentStep]

  return (
    <>
      {/* Welcome Modal */}
      <OnboardingWelcome
        userName={userName}
        isOpen={phase === 'welcome'}
        onStart={handleStartTour}
        onSkip={handleSkip}
      />

      {/* Tour Overlay */}
      <OnboardingOverlay
        targetSelector={currentTourStep?.selector}
        isActive={phase === 'tour'}
        padding={16}
      />

      {/* Tour Tooltip */}
      {phase === 'tour' && currentTourStep && (
        <OnboardingTooltip
          targetSelector={currentTourStep.selector}
          title={currentTourStep.title}
          description={currentTourStep.description}
          stepNumber={currentStep}
          totalSteps={activeSteps.length}
          position={currentTourStep.position}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          isActive={true}
        />
      )}

      {/* Completion Modal */}
      <OnboardingComplete
        isOpen={phase === 'complete'}
        onStartRecording={handleStartRecordingAndClose}
        onClose={handleComplete}
      />
    </>
  )
}

export default DashboardOnboarding
