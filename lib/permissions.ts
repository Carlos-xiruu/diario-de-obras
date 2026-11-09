import type { PapelUsuario } from '@/lib/types'

export function canManageObras(papel: PapelUsuario | null): boolean {
  return papel === 'administrador'
}
