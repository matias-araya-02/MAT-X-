'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { CartItem } from './CartItem'
import { X, Loader2, Trash2 } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

export function CartDrawer() {
  const router = useRouter()
  const { items, isOpen, closeCart, clearCart, totalPrice } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  async function handleCheckout() {
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    try {
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

      clearCart()
      closeCart()
      window.open(data.whatsappUrl, '_blank')
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
          data-lenis-prevent
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <aside
        data-lenis-prevent
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-background z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
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
            className="p-1 text-muted hover:text-text transition-colors"
            aria-label="Cerrar carrito"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCartEmpty className="w-16 h-16 text-muted/30 mb-4" />
              <p className="font-mono text-muted">
                El carrito está vacío.
              </p>
            </div>
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
                {error}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <WhatsAppIcon size={18} />
                  Consultar por WhatsApp
                </>
              )}
            </button>

            <button
              onClick={clearCart}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-mono text-sm text-muted hover:text-red-500 transition-colors disabled:opacity-40"
            >
              <Trash2 size={14} strokeWidth={2} />
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

// Mini componente para el carrito vacío
function ShoppingCartEmpty({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
