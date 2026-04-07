/** Résout les tokens CSS au moment du rendu (re-rendu après changement de thème). */
export function useChartPalette() {
  const root = typeof document !== 'undefined' ? document.documentElement : null
  const g = (name: string, fallback: string) =>
    !root ? fallback : getComputedStyle(root).getPropertyValue(name).trim() || fallback
  return {
    accent: g('--color-accent', '#1A1916'),
    series2: g('--color-info', '#1E40AF'),
    series3: g('--color-text-secondary', '#6B6860'),
    muted: g('--color-text-tertiary', '#A09D97'),
    tick: g('--color-text-secondary', '#6B6860'),
    tickStrong: g('--color-text-primary', '#111110'),
    grid: g('--color-border', '#E2DED7'),
    surface: g('--color-surface', '#FFFFFF'),
    canvas: g('--color-canvas', '#F7F6F3'),
    border: g('--color-border', '#E2DED7'),
  }
}
