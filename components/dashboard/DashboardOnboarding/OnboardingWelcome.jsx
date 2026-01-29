'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// Custom SVG Icons for premium look - responsive sizing
const MicrophoneIcon = ({ className = "w-6 h-6 sm:w-7 sm:h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
)

const SparkleIcon = ({ className = "w-6 h-6 sm:w-7 sm:h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v2m0 14v2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M3 12h2m14 0h2M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const ChatIcon = ({ className = "w-6 h-6 sm:w-7 sm:h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

/**
 * OnboardingWelcome - Premium welcome modal with user's name and tour introduction.
 * Deep burgundy design with custom SVG icons for a refined, professional look.
 */
export const OnboardingWelcome = ({ userName, onStart, onSkip, isOpen }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsExiting(false)
    }
  }, [isOpen])

  const handleClose = (callback) => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      callback?.()
    }, 250)
  }

  if (!isVisible) return null

  const firstName = userName?.split(' ')[0] || 'there'

  const features = [
    { icon: <MicrophoneIcon />, label: 'Record' },
    { icon: <SparkleIcon />, label: 'AI Notes' },
    { icon: <ChatIcon />, label: 'Ask Remy' }
  ]

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        isExiting ? 'animate-backdrop-exit' : 'animate-backdrop-enter'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[hsl(20_10%_8%/0.75)] backdrop-blur-sm"
        onClick={() => handleClose(onSkip)}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-[hsl(355_48%_25%)] rounded-3xl shadow-2xl overflow-hidden ${
          isExiting ? 'animate-modal-exit' : 'animate-modal-enter'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => handleClose(onSkip)}
          className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content - responsive padding */}
        <div className="px-6 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10 text-center">
          {/* Hero Icon - responsive sizing */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6">
            {/* Pulsing glow ring */}
            <div className="absolute inset-0 rounded-2xl bg-[hsl(355_48%_40%/0.4)] animate-pulse-glow" />

            {/* Icon container */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-9 sm:h-9 text-[hsl(355_48%_25%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="11" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <line x1="8" y1="21" x2="16" y2="21" />
              </svg>
            </div>
          </div>

          {/* Title - responsive text */}
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
            Welcome, {firstName}!
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-[15px] text-white/75 leading-relaxed mb-6 sm:mb-8 max-w-[280px] sm:max-w-[300px] mx-auto">
            Let me show you around your new voice notes dashboard.
          </p>

          {/* Feature Row - responsive gap */}
          <div className="flex justify-center items-start gap-6 sm:gap-10 mb-8 sm:mb-10">
            {features.map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 sm:gap-2.5 animate-feature-reveal"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/90">
                  {item.icon}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-white/70 tracking-wide">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Actions - responsive padding */}
          <div className="space-y-2.5 sm:space-y-3">
            <button
              onClick={() => handleClose(onStart)}
              className="w-full py-3 sm:py-3.5 px-6 bg-white text-[hsl(355_48%_25%)] font-semibold rounded-xl hover:bg-white/95 active:scale-[0.98] transition-all shadow-lg"
            >
              Start Quick Tour
            </button>
            <button
              onClick={() => handleClose(onSkip)}
              className="w-full py-2.5 sm:py-3 px-6 text-white/60 text-sm font-medium hover:text-white/90 active:text-white transition-colors"
            >
              I'll explore on my own
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes backdrop-enter {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes backdrop-exit {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes modal-exit {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.2;
          }
        }
        @keyframes feature-reveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-backdrop-enter { animation: backdrop-enter 0.3s ease-out; }
        .animate-backdrop-exit { animation: backdrop-exit 0.25s ease-in forwards; }
        .animate-modal-enter { animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-modal-exit { animation: modal-exit 0.25s ease-in forwards; }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        .animate-feature-reveal {
          opacity: 0;
          animation: feature-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}

export default OnboardingWelcome
