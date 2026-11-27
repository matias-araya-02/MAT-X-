'use client'

import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import type { CartItem as CartItemType } from '@/store/cart'
import { X, Minus, Plus } from 'lucide-react'

interface Props {
  item: CartItemType
}

export function CartItem({ item }: Props) {
  const { updateQuantity, removeItem } = useCartStore()
  const alcanzoMaximo = item.stock !== undefined && item.cantidad >= item.stock

  return (
    <div className="flex gap-3 items-start">
      {/* Imagen */}
      {item.imagen && (
        <div className="relative w-16 h-16 bg-surface flex-shrink-0 rounded">
          <Image
            src={item.imagen}
            alt={item.nombre}
            fill
            className="object-contain p-1"
            sizes="64px"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm truncate">{item.nombre}</p>
        {item.variante && (
          <p className="font-mono text-xs text-muted">{item.variante}</p>
        )}
        <p className="font-mono text-sm text-secondary mt-1">
          ${item.precio.toLocaleString('es-AR')}
        </p>

        {/* Cantidad */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity(item.productoId, item.varianteId, item.cantidad - 1)}
            className="w-6 h-6 bg-background border border-primary/40 hover:border-primary rounded flex items-center justify-center transition-colors"
          >
            <Minus size={12} strokeWidth={2.5} />
          </button>
          <span className="font-mono text-sm w-6 text-center">{item.cantidad}</span>
          <button
            onClick={() => updateQuantity(item.productoId, item.varianteId, item.cantidad + 1)}
            disabled={alcanzoMaximo}
            aria-label="Sumar cantidad"
            className="w-6 h-6 bg-background border border-primary/40 hover:border-primary rounded flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Eliminar */}
      <button
        onClick={() => removeItem(item.productoId, item.varianteId)}
        className="p-1 text-muted hover:text-red-400 transition-colors"
        aria-label="Eliminar del carrito"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
