import { ArrowDown, ArrowUp } from 'lucide-react'
import type { ReactNode } from 'react'

import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type SortDirection = 'asc' | 'desc'

type SortableTableHeadProps = {
  /** Identifiant stable pour le tri (clé de colonne). */
  columnKey: string
  activeKey: string | null
  direction: SortDirection
  onSort: (columnKey: string) => void
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
  title?: string
}

/**
 * En-tête de colonne cliquable : 1er clic = plus grand → plus petit (desc), 2e = inverse.
 * Icône discrète uniquement sur la colonne active.
 */
export function SortableTableHead({
  columnKey,
  activeKey,
  direction,
  onSort,
  children,
  align = 'left',
  className,
  title,
}: SortableTableHeadProps) {
  const active = activeKey === columnKey
  return (
    <TableHead
      className={cn(align === 'right' && 'text-right', 'p-0', className)}
      title={title}
    >
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-0.5 rounded-sm px-1 py-1.5 text-[11px] font-normal transition-colors',
          align === 'right' && 'justify-end',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onSort(columnKey)}
        aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <span>{children}</span>
        {active && direction === 'desc' && (
          <ArrowDown className="size-3 shrink-0 opacity-60" strokeWidth={2} aria-hidden />
        )}
        {active && direction === 'asc' && (
          <ArrowUp className="size-3 shrink-0 opacity-60" strokeWidth={2} aria-hidden />
        )}
      </button>
    </TableHead>
  )
}
