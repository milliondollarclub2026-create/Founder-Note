'use client'

import { useEffect, useState, useRef } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'

/**
 * OnboardingTooltip - A positioned tooltip with arrow that points to the highlighted element.
 * Automatically positions itself to avoid screen edges.
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
  const [tooltipStyle, setTooltipStyle] = useState({ opacity: 0 })
  const [arrowStyle, setArrowStyle] = useState({})
  const [actualPosition, setActualPosition] = useState('bottom')
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!isActive || !targetSelector) return

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

      setActualPosition(pos)

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

      // Clamp to viewport
      left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding))
      top = Math.max(padding, Math.min(top, viewportHeight - tooltipRect.height - padding))

      setTooltipStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        opacity: 1,
        zIndex: 9999
      })

      setArrowStyle({
        position: 'absolute',
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`,
        transform: `rotate(${arrowRotate}deg)`
      })
    }

    // Small delay to ensure target is rendered
    const timer = setTimeout(positionTooltip, 50)
    window.addEventListener('resize', positionTooltip)
    window.addEventListener('scroll', positionTooltip, true)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', positionTooltip)
      window.removeEventListener('scroll', positionTooltip, true)
    }
  }, [targetSelector, isActive, position])

  if (!isActive) return null

  return (
    <div
      ref={tooltipRef}
      style={tooltipStyle}
      className="w-72 bg-[hsl(34_40%_97%)] border border-[hsl(355_48%_39%/0.15)] rounded-2xl shadow-2xl animate-tooltip-enter"
    >
      {/* Arrow */}
      <div style={arrowStyle} className="w-0 h-0">
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
          <path
            d="M12 0L24 12H0L12 0Z"
            fill="hsl(34 40% 97%)"
          />
          <path
            d="M12 1L22.5 11.5H1.5L12 1Z"
            stroke="hsl(355 48% 39% / 0.15)"
            strokeWidth="1"
            fill="none"
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
                    ? 'bg-[hsl(355_48%_39%)]'
                    : i === stepNumber
                    ? 'bg-[hsl(355_48%_39%)] scale-125'
                    : 'bg-[hsl(355_48%_39%/0.2)]'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium text-[hsl(355_48%_39%/0.5)] uppercase tracking-wider ml-auto">
            {stepNumber + 1} of {totalSteps}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-[hsl(355_30%_15%)] mb-1.5 leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-[hsl(355_15%_45%)] leading-relaxed mb-4">
          {description}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {stepNumber > 0 && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[hsl(355_15%_45%)] hover:text-[hsl(355_30%_25%)] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
          )}
          <button
            onClick={onSkip}
            className="text-xs text-[hsl(355_15%_45%/0.6)] hover:text-[hsl(355_15%_45%)] transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={onNext}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[hsl(355_48%_39%)] text-white text-xs font-medium rounded-lg hover:bg-[hsl(355_48%_35%)] transition-colors shadow-sm"
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
