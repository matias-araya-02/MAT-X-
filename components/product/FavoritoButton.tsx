'use client'

import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useFavoritosStore } from '@/store/favoritos'
import { PixelHeart } from './PixelHeart'

interface Props {
  productoId: string
  nombre?: string
  variante?: 'card' | 'detalle'
}

export function FavoritoButton({ productoId, nombre, variante = 'card' }: Props) {
  const activo = useFavoritosStore((s) => s.ids.includes(productoId))
  const toggle = useFavoritosStore((s) => s.toggle)
  const [animar, setAnimar] = useState(false)

  function handleClick(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggle(productoId)
    setAnimar(true)
  }

  const corazon = (size: number) => (
    <PixelHeart
      key={activo ? 'on' : 'off'}
      size={size}
      filled={activo}
      className={animar && activo ? 'animate-heart-pop' : ''}
    />
  )

  if (variante === 'detalle') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={activo}
        className="btn-outline flex w-full items-center justify-center gap-2"
      >
        {corazon(18)}
        {activo ? 'En favoritos' : 'Guardar en favoritos'}
      </button>
    )
  }

  const accion = activo ? 'Quitar de favoritos' : 'Agregar a favoritos'
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={activo}
      aria-label={nombre ? `${accion}: ${nombre}` : accion}
      className="flex h-9 w-9 items-center justify-center border border-primary/30 bg-white text-primary transition-colors hover:border-primary hover:bg-surface"
    >
      {corazon(18)}
    </button>
  )
}
