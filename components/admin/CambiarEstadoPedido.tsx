'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ESTADOS = ['CONSULTA', 'CONFIRMADO', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']

interface Props {
  pedidoId: string
  estadoActual: string
}

export function CambiarEstadoPedido({ pedidoId, estadoActual }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [estado, setEstado] = useState(estadoActual)

  async function handleChange(nuevoEstado: string) {
    if (nuevoEstado === estado) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        setEstado(nuevoEstado)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={estado}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="font-mono text-xs bg-background border border-primary/30 px-2 py-1 focus:outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
    >
      {ESTADOS.map((e) => (
        <option key={e} value={e}>{e}</option>
      ))}
    </select>
  )
}
