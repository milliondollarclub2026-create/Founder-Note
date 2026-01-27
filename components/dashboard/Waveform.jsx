'use client'

export const Waveform = () => (
  <div className="flex items-center gap-[3px] h-5">
    {[...Array(7)].map((_, i) => (
      <div
        key={i}
        className="w-[3px] bg-primary rounded-full waveform-bar"
        style={{ height: '4px' }}
      />
    ))}
  </div>
)
