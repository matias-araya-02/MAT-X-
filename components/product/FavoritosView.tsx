'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useFavoritosStore } from '@/store/favoritos'
import { ProductCard } from '@/components/product/ProductCard'
import { PixelHeart } from '@/components/product/PixelHeart'

function Esqueleto() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] animate-pulse border border-primary/10 bg-surface"
        />
      ))}
    </div>
  )
}

export function FavoritosView() {
  const hidratado = useFavoritosStore((s) => s.hidratado)
  const ids = useFavoritosStore((s) => s.ids)
  const productos = useFavoritosStore((s) => s.productos)
  const descuentoTransferencia = useFavoritosStore((s) => s.descuentoTransferencia)
  const cargando = useFavoritosStore((s) => s.cargando)
  const error = useFavoritosStore((s) => s.error)
  const cargar = useFavoritosStore((s) => s.cargar)

  useEffect(() => {
    if (hidratado && !error) cargar()
  }, [hidratado, error, ids, cargando, cargar])

  const lista = ids.flatMap((id) => (productos[id] ? [productos[id]] : []))

  // Antes de leer localStorage no se muestra "vacío" para evitar el parpadeo
  if (!hidratado) return <Esqueleto />

  if (ids.length === 0) {
    return (
      <div className="py-20 text-center">
        <PixelHeart size={40} className="mx-auto mb-4 text-primary/40" />
        <p className="font-mono text-muted">Todavía no guardaste ningún producto.</p>
        <Link href="/productos" className="btn-primary mt-6 inline-block">
          Ver productos
        </Link>
      </div>
    )
  }

  if (lista.length === 0) {
    if (!error) return <Esqueleto />
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-muted">No pudimos cargar tus favoritos.</p>
        <button type="button" onClick={() => cargar()} className="btn-primary mt-6">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      <p className="mb-6 font-mono text-xs uppercase tracking-wider text-muted">
        <span className="font-bold text-text">{lista.length}</span>{' '}
        producto{lista.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {lista.map((p) => (
          <ProductCard
            key={p.id}
            producto={p}
            descuentoTransferencia={descuentoTransferencia}
          />
        ))}
      </div>
    </>
  )
}
