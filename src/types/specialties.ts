/**
 * Semantic pillars — legal practice areas for organic grouping (URLs / queries map here).
 */

export const LEGAL_SPECIALTIES = [
  { id: 'famille_divorce', label: 'Famille & divorce' },
  { id: 'droit_affaires', label: 'Droit des affaires' },
  { id: 'immobilier', label: 'Immobilier' },
  { id: 'penal', label: 'Pénal' },
  { id: 'travail', label: 'Droit du travail' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'generaliste', label: 'Généraliste / autre' },
] as const

export type LegalSpecialtyId = (typeof LEGAL_SPECIALTIES)[number]['id']
