'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Imagen } from '@prisma/client'

interface Props {
  imagenes: Imagen[]
  nombre: string
}

export function Gallery({ imagenes, nombre }: Props) {
  const [activa, setActiva] = useState(0)

  if (imagenes.length === 0) {
    return (
      <div className="aspect-square bg-surface flex items-center justify-center text-muted font-mono text-sm">
        Sin imagen
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div className="relative aspect-square bg-surface">
        <Image
          src={imagenes[activa].url}
          alt={imagenes[activa].alt ?? nombre}
          fill
          className="object-contain p-6"
          sizes="(max-width: 768px) 100vw, 50vw"
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
              className={`relative w-16 h-16 bg-surface border-2 transition-colors ${
                i === activa ? 'border-primary' : 'border-transparent hover:border-primary/40'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${nombre} ${i + 1}`}
                fill
                className="object-contain p-2"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
