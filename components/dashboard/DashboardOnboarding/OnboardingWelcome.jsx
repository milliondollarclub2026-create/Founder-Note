'use client'

import { useEffect, useState } from 'react'
import { Mic, Sparkles, X } from 'lucide-react'

/**
 * OnboardingWelcome - Initial welcome modal with user's name and tour introduction.
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

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        isExiting ? 'animate-backdrop-exit' : 'animate-backdrop-enter'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[hsl(20_10%_8%/0.7)] backdrop-blur-sm"
        onClick={() => handleClose(onSkip)}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-[hsl(34_40%_97%)] rounded-3xl shadow-2xl overflow-hidden ${
          isExiting ? 'animate-modal-exit' : 'animate-modal-enter'
        }`}
      >
        {/* Skip button */}
        <button
          onClick={() => handleClose(onSkip)}
          className="absolute top-4 right-4 p-2 rounded-full text-[hsl(355_15%_45%/0.5)] hover:text-[hsl(355_15%_45%)] hover:bg-[hsl(355_48%_39%/0.05)] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Decorative header */}
        <div className="relative h-36 bg-gradient-to-br from-[hsl(355_48%_39%)] to-[hsl(355_50%_30%)] overflow-hidden">
          {/* Animated orbs */}
          <div className="absolute inset-0">
            <div className="absolute top-4 left-8 w-24 h-24 rounded-full bg-[hsl(34_40%_97%/0.08)] animate-float-1" />
            <div className="absolute bottom-0 right-12 w-32 h-32 rounded-full bg-[hsl(34_40%_97%/0.05)] animate-float-2" />
            <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-[hsl(34_40%_97%/0.06)] animate-float-3" />
          </div>

          {/* Icon */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-20 h-20 rounded-2xl bg-[hsl(34_40%_97%)] shadow-xl flex items-center justify-center border-4 border-[hsl(34_38%_95%)]">
              <div className="relative">
                <Mic className="w-8 h-8 text-[hsl(355_48%_39%)]" />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[hsl(355_48%_50%)] animate-sparkle" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pt-14 pb-8 text-center">
          <h2 className="text-2xl font-bold text-[hsl(355_30%_15%)] mb-2">
            Welcome, {firstName}!
          </h2>
          <p className="text-[15px] text-[hsl(355_15%_45%)] leading-relaxed mb-6 max-w-[280px] mx-auto">
            Let me show you around your new voice notes dashboard. It'll only take a moment.
          </p>

          {/* Feature hints */}
          <div className="flex justify-center gap-6 mb-8">
            {[
              { icon: '🎙️', label: 'Record' },
              { icon: '✨', label: 'AI Notes' },
              { icon: '💬', label: 'Ask Remy' }
            ].map((item, i) => (
              <div
                key={i}
                className="text-center animate-feature-reveal"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-[11px] font-medium text-[hsl(355_15%_45%/0.7)]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleClose(onStart)}
              className="w-full py-3 px-6 bg-[hsl(355_48%_39%)] text-white font-medium rounded-xl hover:bg-[hsl(355_48%_35%)] transition-colors shadow-lg shadow-[hsl(355_48%_39%/0.25)]"
            >
              Start Quick Tour
            </button>
            <button
              onClick={() => handleClose(onSkip)}
              className="w-full py-2.5 px-6 text-[hsl(355_15%_45%/0.7)] text-sm hover:text-[hsl(355_15%_45%)] transition-colors"
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
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -10px) scale(1.1); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.05); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(calc(-50% + 8px), calc(-50% - 12px)) scale(1.08); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
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
        .animate-float-1 { animation: float-1 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 8s ease-in-out infinite; animation-delay: -2s; }
        .animate-float-3 { animation: float-3 7s ease-in-out infinite; animation-delay: -4s; }
        .animate-sparkle { animation: sparkle 1.5s ease-in-out infinite; }
        .animate-feature-reveal {
          opacity: 0;
          animation: feature-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}

export default OnboardingWelcome
