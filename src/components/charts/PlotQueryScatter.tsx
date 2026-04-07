import * as Plot from '@observablehq/plot'
import { useEffect, useRef, useState } from 'react'

import { useChartPalette } from '@/hooks/use-chart-palette'
import { formatCompact } from '@/lib/format'
import type { QueryScatterPoint } from '@/types/bi'

export function PlotQueryScatter({ data }: { data: QueryScatterPoint[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const p = useChartPalette()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || data.length === 0 || width < 280) return
    el.replaceChildren()
    const w = width
    const plot = Plot.plot({
      width: w,
      height: 280,
      marginLeft: 56,
      marginBottom: 44,
      style: {
        background: 'transparent',
        color: p.tick,
        fontFamily: 'var(--font-sans)',
      },
      x: {
        label: 'Position moyenne (1 = meilleur)',
        grid: true,
        tickFormat: (d: number) => String(Number(d).toFixed(0)),
        nice: true,
      },
      y: {
        label: 'Impressions (échelle logarithmique)',
        type: 'log',
        grid: true,
        tickFormat: (d: number) => formatCompact(Number(d)),
      },
      marks: [
        Plot.dot(data, {
          x: 'position',
          y: (d: QueryScatterPoint) => Math.max(1, d.impressions),
          fill: p.accent,
          stroke: p.surface,
          strokeWidth: 0.85,
          r: 3.25,
          opacity: 0.72,
          tip: true,
          title: (d: QueryScatterPoint) =>
            `${d.query}\nPosition moy. ${d.position.toFixed(1)} · ${formatCompact(d.impressions)} impr.`,
        }),
      ],
    })
    el.append(plot)
    return () => {
      plot.remove()
    }
  }, [data, width, p.accent, p.surface, p.tick])

  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">Pas assez de points.</p>
  }

  return <div ref={ref} className="w-full min-h-[280px]" />
}
