import { useState, useEffect } from 'react'

interface AnimatedNumberProps {
  value: string
  duration?: number
}

export default function AnimatedNumber({ value, duration = 800 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    // Extract numeric part and suffix
    const match = value.match(/^(-?[\d.]+)(.*)$/)
    if (!match) {
      setDisplay(value)
      return
    }

    const target = parseFloat(match[1])
    const suffix = match[2]
    const isDecimal = match[1].includes('.')
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased

      if (isDecimal) {
        setDisplay(current.toFixed(1) + suffix)
      } else {
        setDisplay(Math.round(current) + suffix)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{display}</>
}
