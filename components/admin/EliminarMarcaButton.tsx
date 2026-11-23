'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  marcaId: string
  nombre: string
  productos: number
}

export function EliminarMarcaButton({ marcaId, nombre, productos }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bloqueada = productos > 0

  async function eliminar() {
    if (!confirm(`¿Eliminar la marca "${nombre}"?`)) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/marcas/${marcaId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al eliminar')
        return
      }

      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={eliminar}
        disabled={bloqueada || loading}
        title={
          bloqueada
            ? `No se puede eliminar: tiene ${productos} producto${productos !== 1 ? 's' : ''}`
            : 'Eliminar marca'
        }
        className="font-mono text-xs text-red-500 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
      >
        {loading ? 'Eliminando...' : 'Eliminar'}
      </button>
      {error && <p className="font-mono text-xs text-red-500 mt-1 max-w-[220px]">{error}</p>}
    </div>
  )
}
