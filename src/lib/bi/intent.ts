import type { SearchIntent } from '@/types/bi'

/**
 * Lightweight French keyword heuristics — replace with ML or GSC custom dimensions later.
 */
const TRANSACTIONAL_HINTS =
  /\b(avocat|cabinet|consultation|rendez-vous|rdv|prendre\s+rendez|contact|devis|honoraires|urgence)\b/i

const NAV_HINTS =
  /\b(accueil|mentions?\s+légales|politique|plan\s+du\s+site|contact|qui\s+sommes)\b/i

const INFO_HINTS =
  /\b(comment|pourquoi|qu'est-ce|définition|article|blog|guide)\b/i

export function inferSearchIntent(query: string): { intent: SearchIntent; confidence: number } {
  const q = query.trim()
  if (!q) return { intent: 'informational', confidence: 0.2 }

  if (NAV_HINTS.test(q)) return { intent: 'navigational', confidence: 0.75 }
  if (TRANSACTIONAL_HINTS.test(q)) return { intent: 'transactional', confidence: 0.7 }
  if (INFO_HINTS.test(q)) return { intent: 'informational', confidence: 0.65 }

  return { intent: 'commercial', confidence: 0.45 }
}

export function transactionalWeight(intent: SearchIntent): number {
  switch (intent) {
    case 'transactional':
      return 1
    case 'commercial':
      return 0.65
    case 'informational':
      return 0.35
    case 'navigational':
      return 0.1
    default:
      return 0.35
  }
}
