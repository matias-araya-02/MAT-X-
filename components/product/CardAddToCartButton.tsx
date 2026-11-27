'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'

interface Props {
  productoId: string
  nombre: string
  precio: number // precio final con descuento de producto
  imagen?: string
  stock: number
}

export function CardAddToCartButton({ productoId, nombre, precio, imagen, stock }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const [limite, setLimite] = useState(false)

  const sinStock = stock === 0

  function handleClick() {
    // Se lee el estado al momento del click (no en el render) para evitar
    // diferencias de hidratación con el carrito persistido en localStorage.
    const enCarrito =
      useCartStore
        .getState()
        .items.find((i) => i.productoId === productoId && !i.varianteId)?.cantidad ?? 0

    if (enCarrito >= stock) {
      setLimite(true)
      setTimeout(() => setLimite(false), 1500)
      return
    }

    addItem({ productoId, nombre, precio, imagen, stock })
    openCart()
  }

  return (
    <button type="button" onClick={handleClick} disabled={sinStock} className="btn-cart">
      {sinStock ? 'Sin stock' : limite ? 'Stock máximo' : 'Agregar al carrito'}
    </button>
  )
}
