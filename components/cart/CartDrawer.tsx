'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { CartItem } from './CartItem'

export function CartDrawer() {
  const router = useRouter()
  const { items, isOpen, closeCart, clearCart, totalPrice } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Evitar hydration mismatch con Zustand persist
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  async function handleCheckout() {
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    try {
      // Enviar al servidor solo ids + cantidades (el server recalcula precios)
      const payload = {
        items: items.map((i) => ({
          productoId: i.productoId,
          varianteId: i.varianteId,
          cantidad: i.cantidad,
        })),
      }

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al crear el pedido')
        return
      }

      // Limpiar carrito y cerrar drawer
      clearCart()
      closeCart()

      // Abrir WhatsApp en nueva pestaña
      window.open(data.whatsappUrl, '_blank')

      // Redirigir a la página de confirmación
      router.push(`/pedido/${data.pedidoCodigo}`)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-surface z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          <h2 className="font-heading text-xl font-bold uppercase tracking-wider">
            Tu Carrito
          </h2>
          <button
            onClick={closeCart}
            className="text-muted hover:text-text transition-colors"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="font-mono text-muted text-center mt-12">
              El carrito está vacío.
            </p>
          ) : (
            items.map((item) => (
              <CartItem
                key={`${item.productoId}-${item.varianteId}`}
                item={item}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-primary/20 space-y-3">
            <div className="flex justify-between font-mono font-bold text-lg">
              <span className="text-muted">Total estimado</span>
              <span>${totalPrice().toLocaleString('es-AR')}</span>
            </div>
            <p className="font-mono text-xs text-muted">
              * El precio final lo confirma el vendedor por WhatsApp.
            </p>

            {error && (
              <p className="font-mono text-xs text-red-500 bg-red-50 p-2 rounded">
                ⚠️ {error}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Consultar por WhatsApp
                </>
              )}
            </button>

            <button
              onClick={clearCart}
              disabled={loading}
              className="w-full font-mono text-sm text-muted hover:text-text transition-colors disabled:opacity-40"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
