import { LEGAL_SPECIALTIES, type LegalSpecialtyId } from '@/types/specialties'

export function getSpecialtyLabel(id: LegalSpecialtyId): string {
  const row = LEGAL_SPECIALTIES.find((s) => s.id === id)
  return row?.label ?? id
}
