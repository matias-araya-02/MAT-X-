'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  /** De 0 a 100: cuánto se mueve la imagen respecto del scroll */
  intensidad: number
}

// Si el sistema pide reducir movimiento, el efecto se mantiene pero con este porcentaje del recorrido
const FACTOR_MOVIMIENTO_REDUCIDO = 1

export function ParallaxImage({ src, intensidad }: Props) {
  const seccionRef = useRef<HTMLDivElement>(null)
  const capaRef = useRef<HTMLDivElement>(null)

  // Fracción de la altura de la sección que la imagen puede desplazarse hacia cada lado (0 a 0.5)
  const recorrido = (Math.max(0, Math.min(100, intensidad)) / 100) * 0.5

  useEffect(() => {
    const seccion = seccionRef.current
    const capa = capaRef.current
    if (!seccion || !capa || recorrido === 0) return

    const factor = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? FACTOR_MOVIMIENTO_REDUCIDO
      : 1

    let frame = 0

    const actualizar = () => {
      frame = 0
      const rect = seccion.getBoundingClientRect()
      const alto = window.innerHeight
      if (rect.bottom < 0 || rect.top > alto) return

      // -1 cuando la sección entra por abajo, 0 cuando está centrada, 1 cuando sale por arriba
      const centro = rect.top + rect.height / 2
      const progreso = Math.max(
        -1,
        Math.min(1, (alto / 2 - centro) / (alto / 2 + rect.height / 2))
      )

      capa.style.transform = `translate3d(0, ${progreso * recorrido * factor * rect.height}px, 0)`
    }

    const pedirFrame = () => {
      if (!frame) frame = requestAnimationFrame(actualizar)
    }

    actualizar()
    // capture: true detecta el scroll de la ventana y también el de cualquier contenedor con overflow
    window.addEventListener('scroll', pedirFrame, { passive: true, capture: true })
    window.addEventListener('resize', pedirFrame)

    return () => {
      window.removeEventListener('scroll', pedirFrame, true)
      window.removeEventListener('resize', pedirFrame)
      if (frame) cancelAnimationFrame(frame)
      capa.style.transform = ''
    }
  }, [recorrido])

  return (
    <div ref={seccionRef} className="absolute inset-0 overflow-hidden">
      {/* La capa es más alta que la sección para tener margen de movimiento */}
      <div
        ref={capaRef}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: `${-recorrido * 100}%`, height: `${(1 + 2 * recorrido) * 100}%` }}
      >
        <Image src={src} alt="" fill sizes="100vw" className="object-cover" />
      </div>
    </div>
  )
}