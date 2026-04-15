import { useCallback, useState } from 'react'

import type { SortDirection } from '@/components/ui/sortable-table-head'

/**
 * Tri colonne : 1er clic sur une colonne → desc (grand → petit) ;
 * reclic → inverse asc/desc.
 */
export function useColumnSort() {
  const [state, setState] = useState<{ key: string | null; dir: SortDirection }>({
    key: null,
    dir: 'desc',
  })

  const onSort = useCallback((key: string) => {
    setState((s) => {
      if (s.key !== key) return { key, dir: 'desc' }
      return { key, dir: s.dir === 'desc' ? 'asc' : 'desc' }
    })
  }, [])

  return { sortKey: state.key, direction: state.dir, onSort }
}
