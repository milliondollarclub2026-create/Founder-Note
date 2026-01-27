// 15 Bright and vibrant tag colors
export const TAG_COLOR_PALETTE = {
  coral: { bg: 'hsl(16, 85%, 94%)', text: 'hsl(16, 80%, 40%)', border: 'hsl(16, 75%, 85%)', dot: 'hsl(16, 85%, 58%)' },
  tangerine: { bg: 'hsl(32, 90%, 92%)', text: 'hsl(28, 85%, 38%)', border: 'hsl(32, 80%, 82%)', dot: 'hsl(32, 90%, 55%)' },
  sunshine: { bg: 'hsl(48, 95%, 90%)', text: 'hsl(42, 80%, 35%)', border: 'hsl(48, 85%, 78%)', dot: 'hsl(48, 95%, 52%)' },
  lime: { bg: 'hsl(82, 70%, 90%)', text: 'hsl(82, 60%, 32%)', border: 'hsl(82, 60%, 78%)', dot: 'hsl(82, 70%, 48%)' },
  mint: { bg: 'hsl(158, 60%, 90%)', text: 'hsl(158, 55%, 32%)', border: 'hsl(158, 50%, 78%)', dot: 'hsl(158, 60%, 45%)' },
  teal: { bg: 'hsl(175, 55%, 90%)', text: 'hsl(175, 55%, 30%)', border: 'hsl(175, 50%, 78%)', dot: 'hsl(175, 55%, 42%)' },
  sky: { bg: 'hsl(198, 80%, 92%)', text: 'hsl(198, 70%, 35%)', border: 'hsl(198, 70%, 82%)', dot: 'hsl(198, 80%, 52%)' },
  azure: { bg: 'hsl(212, 75%, 93%)', text: 'hsl(212, 70%, 38%)', border: 'hsl(212, 65%, 84%)', dot: 'hsl(212, 75%, 55%)' },
  lavender: { bg: 'hsl(258, 65%, 94%)', text: 'hsl(258, 55%, 42%)', border: 'hsl(258, 55%, 85%)', dot: 'hsl(258, 65%, 60%)' },
  violet: { bg: 'hsl(280, 60%, 94%)', text: 'hsl(280, 55%, 40%)', border: 'hsl(280, 50%, 85%)', dot: 'hsl(280, 60%, 58%)' },
  magenta: { bg: 'hsl(320, 65%, 93%)', text: 'hsl(320, 55%, 40%)', border: 'hsl(320, 55%, 84%)', dot: 'hsl(320, 65%, 55%)' },
  rose: { bg: 'hsl(345, 70%, 93%)', text: 'hsl(345, 60%, 40%)', border: 'hsl(345, 60%, 84%)', dot: 'hsl(345, 70%, 55%)' },
  ruby: { bg: 'hsl(355, 70%, 93%)', text: 'hsl(355, 60%, 38%)', border: 'hsl(355, 60%, 84%)', dot: 'hsl(355, 70%, 52%)' },
  garnet: { bg: 'hsl(355, 55%, 94%)', text: 'hsl(355, 50%, 38%)', border: 'hsl(355, 48%, 85%)', dot: 'hsl(355, 55%, 48%)' },
  slate: { bg: 'hsl(220, 20%, 94%)', text: 'hsl(220, 25%, 40%)', border: 'hsl(220, 18%, 85%)', dot: 'hsl(220, 22%, 55%)' },
}

// Helper function to get tag color dot
export const getTagColor = (color) => {
  const style = TAG_COLOR_PALETTE[color] || TAG_COLOR_PALETTE.coral
  return style.dot
}

// Tag badge style - used by TagBadge and NoteDetailView
// Returns { bg, text, border, dot } for a given color name
const TAG_BADGE_COLORS = {
  rose: { bg: 'hsl(350, 60%, 94%)', text: 'hsl(350, 60%, 40%)', border: 'hsl(350, 55%, 85%)', dot: 'hsl(350, 65%, 55%)' },
  amber: { bg: 'hsl(38, 75%, 92%)', text: 'hsl(32, 70%, 35%)', border: 'hsl(38, 70%, 82%)', dot: 'hsl(38, 80%, 50%)' },
  emerald: { bg: 'hsl(160, 45%, 92%)', text: 'hsl(160, 50%, 32%)', border: 'hsl(160, 45%, 82%)', dot: 'hsl(160, 50%, 45%)' },
  sapphire: { bg: 'hsl(220, 70%, 94%)', text: 'hsl(220, 80%, 40%)', border: 'hsl(220, 70%, 85%)', dot: 'hsl(220, 80%, 55%)' },
  garnet: { bg: 'hsl(355, 48%, 92%)', text: 'hsl(355, 48%, 35%)', border: 'hsl(355, 45%, 82%)', dot: 'hsl(355, 48%, 45%)' },
  violet: { bg: 'hsl(270, 50%, 94%)', text: 'hsl(270, 55%, 42%)', border: 'hsl(270, 45%, 85%)', dot: 'hsl(270, 55%, 55%)' },
  sage: { bg: 'hsl(140, 30%, 92%)', text: 'hsl(140, 35%, 32%)', border: 'hsl(140, 28%, 82%)', dot: 'hsl(140, 30%, 42%)' },
  terracotta: { bg: 'hsl(18, 50%, 92%)', text: 'hsl(18, 55%, 35%)', border: 'hsl(18, 48%, 82%)', dot: 'hsl(18, 55%, 50%)' },
  plum: { bg: 'hsl(320, 35%, 92%)', text: 'hsl(320, 40%, 38%)', border: 'hsl(320, 32%, 82%)', dot: 'hsl(320, 35%, 50%)' },
  slate: { bg: 'hsl(215, 20%, 93%)', text: 'hsl(215, 25%, 40%)', border: 'hsl(215, 20%, 85%)', dot: 'hsl(215, 25%, 55%)' },
}

export const getTagStyle = (color) => {
  return TAG_BADGE_COLORS[color] || TAG_BADGE_COLORS.slate
}
