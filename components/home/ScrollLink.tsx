'use client'

import type { MouseEvent, ReactNode } from 'react'
import type Lenis from 'lenis'

// ─── Constantes ────────────────────────────────────────────────────────────
const DURACION_MS = 900 // duración de la animación en ms

interface Props {
  href: string
  className?: string
  offset?: number
  children: ReactNode
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function ScrollLink({ href, className, offset = -64, children }: Props) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!href.startsWith('#')) return

    const target = document.getElementById(href.slice(1))
    if (!target) return

    e.preventDefault()

    // Intentar con Lenis si está disponible
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: DURACION_MS / 1000 })
      return
    }

    // Animación manual con rAF (ignora prefers-reduced-motion del SO)
    const startY = window.scrollY
    const endY = target.getBoundingClientRect().top + window.scrollY + offset
    const diff = endY - startY
    let startTime: number | null = null

    function step(now: number) {
      if (startTime === null) startTime = now
      const elapsed = now - startTime
      const progress = Math.min(elapsed / DURACION_MS, 1)
      window.scrollTo(0, startY + diff * easeOutCubic(progress))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
