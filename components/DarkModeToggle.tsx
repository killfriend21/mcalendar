'use client'

import { useTheme } from '@/lib/theme'

export default function DarkModeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={toggleTheme}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${isDark ? 'bg-indigo-600' : 'bg-gray-300'} ${className}`}
    >
      <span
        className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white text-[9px] leading-none shadow transition-transform duration-200 ${isDark ? 'translate-x-6' : 'translate-x-1'}`}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
