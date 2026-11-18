'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { calcularPrecioFinal } from '@/lib/pricing'
import type { Producto, Variante, Imagen, Categoria } from '@prisma/client'

type ProductoConRelaciones = Producto & {
  categoria: Pick<Categoria, 'nombre' | 'slug'>
  imagenes: Imagen[]
  variantes: Variante[]
}

interface Props {
  producto: ProductoConRelaciones
}

export function AddToCartButton({ producto }: Props) {
  const { addItem, openCart } = useCartStore()
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<Variante | null>(
    producto.variantes.length === 1 ? producto.variantes[0] : null
  )
  const [cantidad, setCantidad] = useState(1)

  const tieneVariantes = producto.variantes.length > 0
  const imagen = producto.imagenes[0]?.url

  // Stock disponible según si tiene variantes o no
  const stockDisponible = varianteSeleccionada
    ? varianteSeleccionada.stock
    : tieneVariantes
    ? 0
    : producto.stock

  // Precio final considerando override de variante
  const precioBase = varianteSeleccionada?.precio ?? producto.precio
  const precioFinal = calcularPrecioFinal(precioBase, producto.descuento)

  const puedeAgregar =
    (!tieneVariantes || varianteSeleccionada !== null) && stockDisponible > 0

  function handleAgregar() {
    if (!puedeAgregar) return

    addItem({
      productoId: producto.id,
      varianteId: varianteSeleccionada?.id,
      nombre: producto.nombre,
      variante: varianteSeleccionada?.nombre,
      precio: precioFinal,
      imagen,
    })
    openCart()
  }

  return (
    <div className="space-y-4">
      {/* Selector de variante */}
      {tieneVariantes && (
        <div>
          <p className="font-mono text-xs text-muted uppercase tracking-wider mb-2">
            Variante
          </p>
          <div className="flex flex-wrap gap-2">
            {producto.variantes.map((v) => (
              <button
                key={v.id}
                onClick={() => setVarianteSeleccionada(v)}
                disabled={v.stock === 0}
                className={`px-4 py-2 font-sans text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  varianteSeleccionada?.id === v.id
                    ? 'bg-primary text-white border-primary'
                    : 'border-primary/40 text-text hover:border-primary'
                }`}
              >
                {v.nombre}
                {v.stock === 0 && ' (sin stock)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cantidad */}
      <div>
        <p className="font-mono text-xs text-muted uppercase tracking-wider mb-2">
          Cantidad
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            className="w-8 h-8 border border-primary/40 hover:border-primary font-mono flex items-center justify-center transition-colors"
          >
            −
          </button>
          <span className="font-mono text-lg w-8 text-center">{cantidad}</span>
          <button
            onClick={() => setCantidad((c) => Math.min(stockDisponible, c + 1))}
            disabled={cantidad >= stockDisponible}
            className="w-8 h-8 border border-primary/40 hover:border-primary font-mono flex items-center justify-center transition-colors disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {/* Botón agregar */}
      <button
        onClick={handleAgregar}
        disabled={!puedeAgregar}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!puedeAgregar
          ? tieneVariantes && !varianteSeleccionada
            ? 'Seleccioná una variante'
            : 'Sin stock'
          : 'Agregar al carrito'}
      </button>

      {tieneVariantes && !varianteSeleccionada && (
        <p className="font-mono text-xs text-muted text-center">
          ↑ Seleccioná una opción para continuar
        </p>
      )}
    </div>
  )
}
