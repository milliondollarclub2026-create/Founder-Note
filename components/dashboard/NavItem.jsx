'use client'

export const NavItem = ({ icon: Icon, label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-smooth
      ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span className="flex-1 text-left truncate">{label}</span>
    {count > 0 && <span className={`text-[11px] ${active ? 'opacity-80' : 'text-muted-foreground'}`}>{count}</span>}
  </button>
)
