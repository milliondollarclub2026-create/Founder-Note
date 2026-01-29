'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

// Premium Microphone Icon
const MicrophoneIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
)

/**
 * OnboardingComplete - Celebration modal with CTA to start recording.
 * Premium burgundy design matching the welcome modal.
 */
export const OnboardingComplete = ({ onStartRecording, onClose, isOpen }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsExiting(false)
      // Trigger confetti after modal appears
      setTimeout(() => setShowConfetti(true), 400)
    }
  }, [isOpen])

  const handleClose = (callback) => {
    setIsExiting(true)
    setShowConfetti(false)
    setTimeout(() => {
      setIsVisible(false)
      callback?.()
    }, 250)
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        isExiting ? 'animate-backdrop-exit' : 'animate-backdrop-enter'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[hsl(20_10%_8%/0.75)] backdrop-blur-sm"
        onClick={() => handleClose(onClose)}
      />

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm animate-confetti"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: '-10px',
                backgroundColor: [
                  'hsl(355 48% 50%)',
                  'hsl(34 70% 70%)',
                  'hsl(355 48% 65%)',
                  'hsl(34 40% 85%)',
                  'white'
                ][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-[hsl(355_48%_25%)] rounded-3xl shadow-2xl overflow-hidden ${
          isExiting ? 'animate-modal-exit' : 'animate-modal-enter'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => handleClose(onClose)}
          className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content - responsive padding */}
        <div className="px-6 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10 text-center">
          {/* Success icon - responsive sizing */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full bg-white/10 animate-ring-1" />
            <div className="absolute inset-1.5 sm:inset-2 rounded-full bg-white/15 animate-ring-2" />
            <div className="absolute inset-3 sm:inset-4 rounded-full bg-white/20 animate-ring-3" />

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center shadow-lg animate-icon-pop">
                <Check className="w-5 h-5 sm:w-7 sm:h-7 text-[hsl(355_48%_25%)] stroke-[3]" />
              </div>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
            You're all set!
          </h2>
          <p className="text-sm sm:text-[15px] text-white/75 leading-relaxed mb-6 sm:mb-8 max-w-[260px] sm:max-w-[280px] mx-auto">
            Your dashboard is ready. Record your first voice note and watch the magic happen.
          </p>

          {/* CTA - responsive sizing */}
          <button
            onClick={() => handleClose(onStartRecording)}
            className="group relative w-full py-3.5 sm:py-4 px-6 bg-white text-[hsl(355_48%_25%)] font-semibold rounded-xl hover:bg-white/95 active:scale-[0.98] transition-all shadow-lg overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(355_48%_25%/0.1)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            <span className="relative flex items-center justify-center gap-2">
              <MicrophoneIcon />
              Record Your First Note
            </span>
          </button>

          <p className="mt-4 sm:mt-5 text-[11px] sm:text-xs text-white/50">
            Tip: Say <span className="font-medium text-white/70">"Hey Remy"</span> anytime to chat with your AI assistant
          </p>
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
        @keyframes ring-1 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.1; }
        }
        @keyframes ring-2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.2; }
        }
        @keyframes ring-3 {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.3; }
        }
        @keyframes icon-pop {
          0% { transform: scale(0); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-backdrop-enter { animation: backdrop-enter 0.3s ease-out; }
        .animate-backdrop-exit { animation: backdrop-exit 0.25s ease-in forwards; }
        .animate-modal-enter { animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-modal-exit { animation: modal-exit 0.25s ease-in forwards; }
        .animate-ring-1 { animation: ring-1 2s ease-in-out infinite; }
        .animate-ring-2 { animation: ring-2 2s ease-in-out infinite 0.15s; }
        .animate-ring-3 { animation: ring-3 2s ease-in-out infinite 0.3s; }
        .animate-icon-pop { animation: icon-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .animate-confetti { animation: confetti linear forwards; }
      `}</style>
    </div>
  )
}

export default OnboardingComplete
