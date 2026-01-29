'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * OnboardingOverlay - Creates a dark backdrop with an animated spotlight cutout
 * that highlights the target element during onboarding.
 */
export const OnboardingOverlay = ({ targetSelector, isActive, padding = 12 }) => {
  const [targetRect, setTargetRect] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!isActive || !targetSelector) {
      setIsVisible(false)
      return
    }

    const updatePosition = () => {
      const target = document.querySelector(targetSelector)
      if (target) {
        const rect = target.getBoundingClientRect()
        setTargetRect({
          x: rect.left - padding,
          y: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius: Math.min(rect.width, rect.height) * 0.15 + padding
        })
        setIsVisible(true)
      }
    }

    // Initial position
    updatePosition()

    // Track position changes (scroll, resize)
    const handleUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updatePosition)
    }

    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)

    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targetSelector, isActive, padding])

  if (!isActive || !isVisible || !targetRect) return null

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* SVG mask for the spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          {/* Animated gradient for the spotlight ring */}
          <radialGradient id="spotlightGlow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="hsl(355 48% 39%)" stopOpacity="0" />
            <stop offset="85%" stopColor="hsl(355 48% 39%)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(355 48% 39%)" stopOpacity="0" />
          </radialGradient>

          <mask id="spotlightMask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.x}
              y={targetRect.y}
              width={targetRect.width}
              height={targetRect.height}
              rx={targetRect.borderRadius}
              fill="black"
              className="animate-spotlight-reveal"
            />
          </mask>
        </defs>

        {/* Dark overlay with cutout */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 12, 10, 0.75)"
          mask="url(#spotlightMask)"
          className="animate-overlay-fade"
        />

        {/* Subtle glow ring around spotlight */}
        <rect
          x={targetRect.x - 8}
          y={targetRect.y - 8}
          width={targetRect.width + 16}
          height={targetRect.height + 16}
          rx={targetRect.borderRadius + 8}
          fill="none"
          stroke="hsl(355 48% 39% / 0.4)"
          strokeWidth="2"
          className="animate-ring-pulse"
        />

        {/* Inner highlight ring */}
        <rect
          x={targetRect.x - 2}
          y={targetRect.y - 2}
          width={targetRect.width + 4}
          height={targetRect.height + 4}
          rx={targetRect.borderRadius + 2}
          fill="none"
          stroke="hsl(34 40% 97% / 0.6)"
          strokeWidth="1"
          className="animate-ring-pulse"
          style={{ animationDelay: '0.15s' }}
        />
      </svg>

      <style jsx>{`
        @keyframes spotlight-reveal {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes overlay-fade {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes ring-pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }

        .animate-spotlight-reveal {
          animation: spotlight-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: center;
          transform-box: fill-box;
        }

        .animate-overlay-fade {
          animation: overlay-fade 0.35s ease-out forwards;
        }

        .animate-ring-pulse {
          animation: ring-pulse 2.5s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
      `}</style>
    </div>
  )
}

export default OnboardingOverlay
