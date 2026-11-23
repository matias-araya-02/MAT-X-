'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const RESPETAR_MOVIMIENTO_REDUCIDO = true

export function SmoothScroll() {
  useEffect(() => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    console.log(
      '[SmoothScroll] montado | reducir movimiento:',
      reducido,
      '| respetar:',
      RESPETAR_MOVIMIENTO_REDUCIDO
    )

    if (RESPETAR_MOVIMIENTO_REDUCIDO && reducido) {
      console.log('[SmoothScroll] NO se activa por la opción de reducir movimiento')
      return
    }

    const lenis = new Lenis({
      duration: 2.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      autoRaf: true,
    })

      // Solo para diagnóstico: permite inspeccionar la instancia desde la consola
      ; (window as unknown as { __lenis?: Lenis }).__lenis = lenis
    console.log('[SmoothScroll] Lenis activo, opciones:', lenis.options)

    return () => {
      lenis.destroy()
      delete (window as unknown as { __lenis?: Lenis }).__lenis
    }
  }, [])

  return null
}