import type { LegalSpecialtyId } from '@/types/specialties'

/**
 * Map landing URLs to pillars — extend with real path rules for jplouton-avocat.fr.
 */
export function resolveSpecialtyFromPage(pageUrl: string): LegalSpecialtyId {
  const u = pageUrl.toLowerCase()

  if (/(divorce|famille|pension|garde|mariage)/i.test(u)) return 'famille_divorce'
  if (/(soci[eé]t[eé]|entreprise|commercial|bail|contrat)/i.test(u)) return 'droit_affaires'
  if (/(immobilier|copropri|bail\s+habitation|vente)/i.test(u)) return 'immobilier'
  if (/(p[eé]nal|d[fé]fense|garde[\s-][aà]\s+vue)/i.test(u)) return 'penal'
  if (/(travail|licenci|prud.hommes|salari)/i.test(u)) return 'travail'
  if (/(fiscal|imp[oô]t|tax)/i.test(u)) return 'fiscal'

  return 'generaliste'
}
