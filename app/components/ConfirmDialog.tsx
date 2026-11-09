'use client'

import { useEffect, useId, useRef } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  busy?: boolean
  danger?: boolean
  children?: React.ReactNode
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel, busy = false, danger = false, children, onCancel, onConfirm }: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelButton.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, onCancel, open])

  if (!open) return null

  return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/75 p-4 sm:items-center sm:justify-center" role="presentation">
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-6 shadow-2xl">
      <h2 id={titleId} className="text-xl font-black text-white">{title}</h2>
      <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      {children}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button ref={cancelButton} type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-slate-600 px-4 py-3 font-bold text-slate-200 disabled:opacity-60">Voltar</button>
        <button type="button" disabled={busy} onClick={onConfirm} className={`rounded-xl px-4 py-3 font-bold text-white disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{busy ? 'Processando...' : confirmLabel}</button>
      </div>
    </div>
  </div>
}
