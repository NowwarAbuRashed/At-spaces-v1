import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ChartSize {
  width: number
  height: number
}

export interface ChartContainerProps {
  className?: string
  height?: number
  children: (size: ChartSize) => ReactNode
}

export function ChartContainer({ className, height = 320, children }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<ChartSize>({ width: 0, height })

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }

    const updateSize = () => {
      const nextWidth = Math.max(0, Math.floor(element.clientWidth))
      setSize((previous) => {
        if (previous.width === nextWidth && previous.height === height) {
          return previous
        }
        return { width: nextWidth, height }
      })
    }

    updateSize()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateSize())
      observer.observe(element)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [height])

  return (
    <div ref={containerRef} className={cn('h-[320px] min-h-[320px] w-full', className)}>
      {size.width > 0 ? children(size) : null}
    </div>
  )
}
