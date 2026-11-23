'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  nombre: string
  cantidadProductos: number
}

export function DeleteCategoriaButton({ id, nombre, cantidadProductos }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bloqueada = cantidadProductos > 0

  async function eliminar() {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/categorias/${id}`, { method: 'DELETE' })
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
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={eliminar}
        disabled={loading || bloqueada}
        title={bloqueada ? 'Tiene productos asociados' : undefined}
        className="text-xs text-red-500 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
      >
        {loading ? 'Eliminando...' : 'Eliminar'}
      </button>
      {error && <p className="mt-1 max-w-xs text-right text-xs text-red-500">{error}</p>}
    </div>
  )
}
