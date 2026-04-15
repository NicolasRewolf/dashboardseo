import type { PageSegmentMode } from '@/types/bi'
import type { GscDimensionFilterGroup } from '@/types/gsc'

/** Segments blog : chemins d’URL contenant ce fragment (insensible à la casse sur le chemin). */
export const BLOG_PATH_MARKER = '/post/'

/** Filtre API GSC sur la dimension `page` (utilisé pour requêtes date & query×page). */
export function pageSegmentToGscFilters(
  mode: PageSegmentMode
): GscDimensionFilterGroup[] | undefined {
  if (mode === 'all') return undefined
  if (mode === 'blog') {
    return [
      {
        groupType: 'and',
        filters: [{ dimension: 'page', operator: 'contains', expression: BLOG_PATH_MARKER }],
      },
    ]
  }
  return [
    {
      groupType: 'and',
      filters: [{ dimension: 'page', operator: 'notContains', expression: BLOG_PATH_MARKER }],
    },
  ]
}
