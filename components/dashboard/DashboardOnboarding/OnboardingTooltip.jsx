'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'

/**
 * OnboardingTooltip - A positioned tooltip with arrow that points to the highlighted element.
 * Premium burgundy design matching the welcome modal.
 * Uses two-pass rendering to ensure correct positioning.
 */
export const OnboardingTooltip = ({
  targetSelector,
  title,
  description,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isActive,
  position = 'auto' // 'top' | 'bottom' | 'left' | 'right' | 'auto'
}) => {
  const [tooltipStyle, setTooltipStyle] = useState({ visibility: 'hidden', position: 'fixed', top: 0, left: 0 })
  const [arrowStyle, setArrowStyle] = useState({})
  const [isPositioned, setIsPositioned] = useState(false)
  const tooltipRef = useRef(null)
  const positionTimeoutRef = useRef(null)

  useEffect(() => {
    if (!isActive || !targetSelector) {
      setIsPositioned(false)
      return
    }

    const positionTooltip = () => {
      const target = document.querySelector(targetSelector)
      const tooltip = tooltipRef.current
      if (!target || !tooltip) return

      const targetRect = target.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const padding = 16
      const arrowSize = 12
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // If tooltip hasn't rendered with dimensions yet, wait
      if (tooltipRect.width === 0 || tooltipRect.height === 0) {
        positionTimeoutRef.current = setTimeout(positionTooltip, 50)
        return
      }

      // Determine best position if auto
      let pos = position
      if (position === 'auto') {
        const spaceAbove = targetRect.top
        const spaceBelow = viewportHeight - targetRect.bottom
        const spaceLeft = targetRect.left
        const spaceRight = viewportWidth - targetRect.right

        // Prefer bottom, then top, then right, then left
        if (spaceBelow >= tooltipRect.height + padding + arrowSize) {
          pos = 'bottom'
        } else if (spaceAbove >= tooltipRect.height + padding + arrowSize) {
          pos = 'top'
        } else if (spaceRight >= tooltipRect.width + padding + arrowSize) {
          pos = 'right'
        } else {
          pos = 'left'
        }
      }

      let top, left, arrowTop, arrowLeft, arrowRotate

      switch (pos) {
        case 'top':
          top = targetRect.top - tooltipRect.height - arrowSize - 8
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
          arrowTop = tooltipRect.height - 1
          arrowLeft = tooltipRect.width / 2 - arrowSize
          arrowRotate = 180
          break
        case 'bottom':
          top = targetRect.bottom + arrowSize + 8
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2
          arrowTop = -arrowSize + 1
          arrowLeft = tooltipRect.width / 2 - arrowSize
          arrowRotate = 0
          break
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
          left = targetRect.left - tooltipRect.width - arrowSize - 8
          arrowTop = tooltipRect.height / 2 - arrowSize
          arrowLeft = tooltipRect.width - 1
          arrowRotate = 90
          break
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2
          left = targetRect.right + arrowSize + 8
          arrowTop = tooltipRect.height / 2 - arrowSize
          arrowLeft = -arrowSize + 1
          arrowRotate = -90
          break
      }

      // Clamp to viewport with extra margin
      const originalLeft = left
      left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding))
      top = Math.max(padding, Math.min(top, viewportHeight - tooltipRect.height - padding))

      // Recalculate arrow horizontal position if tooltip was shifted horizontally
      // so the arrow still points at the target center
      const horizontalShift = originalLeft - left
      if (pos === 'top' || pos === 'bottom') {
        // Adjust arrow to still point at target center
        const targetCenterX = targetRect.left + targetRect.width / 2
        const newArrowLeft = targetCenterX - left - arrowSize
        // Clamp arrow to stay within tooltip bounds (with padding)
        arrowLeft = Math.max(16, Math.min(newArrowLeft, tooltipRect.width - 40))
      }

      setTooltipStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        visibility: 'visible',
        zIndex: 9999
      })

      setArrowStyle({
        position: 'absolute',
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`,
        transform: `rotate(${arrowRotate}deg)`
      })

      setIsPositioned(true)
    }

    // Use requestAnimationFrame to ensure DOM has painted
    const frame = requestAnimationFrame(() => {
      positionTimeoutRef.current = setTimeout(positionTooltip, 10)
    })

    window.addEventListener('resize', positionTooltip)
    window.addEventListener('scroll', positionTooltip, true)

    return () => {
      cancelAnimationFrame(frame)
      if (positionTimeoutRef.current) clearTimeout(positionTimeoutRef.current)
      window.removeEventListener('resize', positionTooltip)
      window.removeEventListener('scroll', positionTooltip, true)
    }
  }, [targetSelector, isActive, position, stepNumber]) // Added stepNumber to re-position on step change

  if (!isActive) return null

  return (
    <div
      ref={tooltipRef}
      style={tooltipStyle}
      className={`w-[calc(100vw-32px)] sm:w-72 max-w-72 bg-[hsl(355_48%_25%)] rounded-2xl shadow-2xl ${
        isPositioned ? 'animate-tooltip-enter' : ''
      }`}
    >
      {/* Arrow */}
      <div style={arrowStyle} className="w-0 h-0">
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
          <path
            d="M12 0L24 12H0L12 0Z"
            fill="hsl(355 48% 25%)"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i < stepNumber
                    ? 'bg-white'
                    : i === stepNumber
                    ? 'bg-white scale-125'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider ml-auto">
            {stepNumber + 1} of {totalSteps}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white mb-1.5 leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-white/75 leading-relaxed mb-4">
          {description}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {stepNumber > 0 && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
          )}
          <button
            onClick={onSkip}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={onNext}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-white text-[hsl(355_48%_25%)] text-xs font-semibold rounded-lg hover:bg-white/95 transition-colors shadow-sm"
          >
            {stepNumber === totalSteps - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes tooltip-enter {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-tooltip-enter {
          animation: tooltip-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}

export default OnboardingTooltip
