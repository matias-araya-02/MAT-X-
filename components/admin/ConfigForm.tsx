'use client'

import { useState, useEffect } from 'react'

interface ConfigData {
  descuentoTransferencia: number
}

export default function ConfigForm() {
  const [descuento, setDescuento] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data: ConfigData) => {
        setDescuento(data.descuentoTransferencia)
        setLoading(false)
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Error al cargar configuración' })
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descuentoTransferencia: descuento }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Descuento por transferencia */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 max-w-xl">
        <h2 className="font-heading text-xl font-bold mb-1">
          Descuento por transferencia
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Porcentaje de descuento que se aplica cuando el cliente paga por transferencia bancaria.
          Se muestra en el AnnouncementBar y en el checkout.
        </p>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={100}
            value={descuento}
            onChange={(e) => setDescuento(Number(e.target.value))}
            className="w-24 border border-zinc-300 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <span className="text-lg font-bold text-zinc-600">%</span>
        </div>
      </div>

      {/* Info WhatsApp */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 max-w-xl">
        <h2 className="font-heading text-xl font-bold mb-1">
          Número de WhatsApp
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Número al que se envían los pedidos. Se configura en la variable de entorno{' '}
          <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_WHATSAPP_NUMBER</code>{' '}
          en el archivo <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-xs">.env.local</code>.
        </p>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
          <p className="text-sm text-zinc-600">
            Número actual:{' '}
            <span className="font-mono font-bold text-zinc-900">
              {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || 'No configurado'}
            </span>
          </p>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white font-heading font-bold uppercase px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {message && (
          <p
            className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message.type === 'success' ? '✓' : '✗'} {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
