'use client'

const PRESET_COLORS = [
  { hex: '#3B82F6', label: 'Blue' },
  { hex: '#2563EB', label: 'Blue 600' },
  { hex: '#1D4ED8', label: 'Blue 700' },
  { hex: '#06B6D4', label: 'Cyan' },
  { hex: '#0891B2', label: 'Cyan 600' },
  { hex: '#10B981', label: 'Emerald' },
  { hex: '#059669', label: 'Emerald 600' },
  { hex: '#22C55E', label: 'Green' },
  { hex: '#16A34A', label: 'Green 600' },
  { hex: '#84CC16', label: 'Lime' },
  { hex: '#EAB308', label: 'Yellow' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#F97316', label: 'Orange' },
  { hex: '#EA580C', label: 'Orange 600' },
  { hex: '#EF4444', label: 'Red' },
  { hex: '#DC2626', label: 'Red 600' },
  { hex: '#F43F5E', label: 'Rose' },
  { hex: '#EC4899', label: 'Pink' },
  { hex: '#DB2777', label: 'Pink 600' },
  { hex: '#A855F7', label: 'Purple' },
  { hex: '#9333EA', label: 'Purple 600' },
  { hex: '#8B5CF6', label: 'Violet' },
  { hex: '#7C3AED', label: 'Violet 600' },
  { hex: '#6366F1', label: 'Indigo' },
  { hex: '#4F46E5', label: 'Indigo 600' },
  { hex: '#14B8A6', label: 'Teal' },
  { hex: '#0D9488', label: 'Teal 600' },
  { hex: '#64748B', label: 'Slate' },
  { hex: '#6B7280', label: 'Gray' },
  { hex: '#374151', label: 'Dark' },
]

const PRESET_PASTEL = [
  { hex: '#FEF3C7', label: 'Yellow' },
  { hex: '#FEE2E2', label: 'Red' },
  { hex: '#DCFCE7', label: 'Green' },
  { hex: '#DBEAFE', label: 'Blue' },
  { hex: '#F3E8FF', label: 'Purple' },
  { hex: '#FFEDD5', label: 'Orange' },
  { hex: '#FCE7F3', label: 'Pink' },
  { hex: '#CFFAFE', label: 'Cyan' },
  { hex: '#D1FAE5', label: 'Emerald' },
  { hex: '#E0E7FF', label: 'Indigo' },
  { hex: '#F1F5F9', label: 'Slate' },
  { hex: '#F9A8D4', label: 'Rose' },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  variant?: 'vivid' | 'pastel'
}

export default function ColorPicker({ value, onChange, variant = 'vivid' }: ColorPickerProps) {
  const colors = variant === 'pastel' ? PRESET_PASTEL : PRESET_COLORS
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {colors.map(c => (
        <button
          key={c.hex}
          type="button"
          title={c.label}
          onClick={() => onChange(c.hex)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: c.hex,
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            boxShadow: value === c.hex
              ? '0 0 0 2px white, 0 0 0 4px #3b82f6'
              : 'inset 0 0 0 1px rgba(0,0,0,0.15)',
            transform: 'scale(1)',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
      ))}
    </div>
  )
}
