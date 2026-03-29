interface SliderProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, className = '' }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${className}`}
      style={{
        background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
        outline: 'none',
      }}
    />
  )
}
