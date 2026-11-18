'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  productoId: string
  activo: boolean
}

export function ToggleProductoActivo({ productoId, activo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState(activo)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/productos/${productoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !estado }),
      })
      if (res.ok) {
        setEstado(!estado)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        estado ? 'bg-primary' : 'bg-gray-300'
      }`}
      title={estado ? 'Desactivar' : 'Activar'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          estado ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
