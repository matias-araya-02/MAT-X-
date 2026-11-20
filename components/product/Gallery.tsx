'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Imagen } from '@prisma/client'

interface Props {
  imagenes: Imagen[]
  nombre: string
}

// Nivel de zoom al pasar el cursor (2 = el doble)
const ZOOM = 2

export function Gallery({ imagenes, nombre }: Props) {
  const [activa, setActiva] = useState(0)
  const [zoom, setZoom] = useState({ activo: false, x: 50, y: 50 })

  if (imagenes.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-surface font-mono text-sm text-muted">
        Sin imagen
      </div>
    )
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    // Solo con mouse: en pantallas táctiles no se hace zoom
    if (e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoom({ activo: true, x, y })
  }

  function onPointerLeave() {
    setZoom((z) => ({ ...z, activo: false }))
  }

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden bg-white"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <Image
          src={imagenes[activa].url}
          alt={imagenes[activa].alt ?? nombre}
          fill
          className="object-contain transition-transform duration-200 ease-out"
          style={{
            transform: zoom.activo ? `scale(${ZOOM})` : 'scale(1)',
            transformOrigin: `${zoom.x}% ${zoom.y}%`,
          }}
          sizes="(max-width: 768px) 100vw, 1000px"
          priority
        />
      </div>

      {/* Thumbnails */}
      {imagenes.length > 1 && (
        <div className="flex gap-2">
          {imagenes.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiva(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === activa}
              className={`relative h-16 w-16 border-2 bg-white transition-colors ${i === activa
                  ? 'border-primary'
                  : 'border-transparent hover:border-primary/40'
                }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${nombre} ${i + 1}`}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}