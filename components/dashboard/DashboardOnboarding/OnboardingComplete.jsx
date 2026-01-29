'use client'

import { useEffect, useState } from 'react'
import { Mic, Check, Sparkles, X } from 'lucide-react'

/**
 * OnboardingComplete - Celebration modal with CTA to start recording.
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
        className="absolute inset-0 bg-[hsl(20_10%_8%/0.7)] backdrop-blur-sm"
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
                  'hsl(355 48% 39%)',
                  'hsl(34 70% 60%)',
                  'hsl(355 48% 55%)',
                  'hsl(34 40% 80%)',
                  'hsl(355 30% 70%)'
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
        className={`relative w-full max-w-md bg-[hsl(34_40%_97%)] rounded-3xl shadow-2xl overflow-hidden ${
          isExiting ? 'animate-modal-exit' : 'animate-modal-enter'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => handleClose(onClose)}
          className="absolute top-4 right-4 p-2 rounded-full text-[hsl(355_15%_45%/0.5)] hover:text-[hsl(355_15%_45%)] hover:bg-[hsl(355_48%_39%/0.05)] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-8 pt-10 pb-8 text-center">
          {/* Success icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Rings */}
            <div className="absolute inset-0 rounded-full bg-[hsl(355_48%_39%/0.1)] animate-ring-1" />
            <div className="absolute inset-2 rounded-full bg-[hsl(355_48%_39%/0.15)] animate-ring-2" />
            <div className="absolute inset-4 rounded-full bg-[hsl(355_48%_39%/0.2)] animate-ring-3" />

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[hsl(355_48%_39%)] flex items-center justify-center shadow-lg animate-icon-pop">
                <Check className="w-7 h-7 text-white stroke-[3]" />
              </div>
            </div>

            {/* Sparkles */}
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-[hsl(355_48%_50%)] animate-sparkle-1" />
            <Sparkles className="absolute -bottom-1 -left-2 w-4 h-4 text-[hsl(34_70%_55%)] animate-sparkle-2" />
          </div>

          <h2 className="text-2xl font-bold text-[hsl(355_30%_15%)] mb-2">
            You're all set!
          </h2>
          <p className="text-[15px] text-[hsl(355_15%_45%)] leading-relaxed mb-8 max-w-[280px] mx-auto">
            Your dashboard is ready. Record your first voice note and watch the magic happen.
          </p>

          {/* CTA */}
          <button
            onClick={() => handleClose(onStartRecording)}
            className="group relative w-full py-4 px-6 bg-[hsl(355_48%_39%)] text-white font-medium rounded-xl hover:bg-[hsl(355_48%_35%)] transition-all shadow-xl shadow-[hsl(355_48%_39%/0.3)] overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            <span className="relative flex items-center justify-center gap-2">
              <Mic className="w-5 h-5" />
              Record Your First Note
            </span>
          </button>

          <p className="mt-4 text-xs text-[hsl(355_15%_45%/0.5)]">
            Tip: Say <span className="font-medium">"Hey Remy"</span> anytime to chat with your AI assistant
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
        @keyframes sparkle-1 {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.5; transform: scale(0.8) rotate(15deg); }
        }
        @keyframes sparkle-2 {
          0%, 100% { opacity: 0.8; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.4; transform: scale(0.7) rotate(-15deg); }
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
        .animate-sparkle-1 { animation: sparkle-1 1.5s ease-in-out infinite; }
        .animate-sparkle-2 { animation: sparkle-2 1.8s ease-in-out infinite 0.3s; }
        .animate-confetti { animation: confetti linear forwards; }
      `}</style>
    </div>
  )
}

export default OnboardingComplete
