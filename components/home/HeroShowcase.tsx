'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { useHeroSync } from './HeroSync'

export interface HeroSlideData {
  id: string
  nombre: string
  slug: string
  categoria: string
  marca: string | null
  imagenUrl: string
  palabra: string
  precio: number
  precioFinal: number
  descuento: number
  precioTransferencia: number | null
}

interface Props {
  slides: HeroSlideData[]
}

// Tiempo que se queda cada slide
const INTERVALO_MS = 5000

// true:  respeta "reducir movimiento" del sistema (queda quieto y se maneja a mano).
//        Es lo recomendable para producción.
// false: siempre rota, aunque el sistema tenga ese ajuste (útil para probar).
const RESPETAR_MOVIMIENTO_REDUCIDO = false

// ── Qué se muestra (poné true para volver a mostrar algo) ─────────────────
const VER = {
  flechas: false, // flechas ← → junto a los puntos
  numero: false, // número de slide ("01") delante de la categoría
  badgeDescuento: true, // etiqueta "-15%" cuando hay descuento
  precioAnterior: true, // precio tachado cuando el producto tiene descuento
  precioTransferencia: true, // línea "$X transferencia" debajo del precio
}

// ── Intensidad de los elementos decorativos (de 0 a 1) ────────────────────
const OPACIDAD_PALABRA = 0.08 // palabra gigante de fondo
const OPACIDAD_VECINOS = 0.2 // productos que asoman a los costados
const OPACIDAD_RESPLANDOR = 0.16 // resplandor violeta detrás del producto
const OPACIDAD_SOMBRA = 0.16 // sombra en el piso

// ── Arrastre ──────────────────────────────────────────────────────────────
// Píxeles que hay que mover antes de empezar a arrastrar (menos que eso es un click)
const UMBRAL_INICIO = 6
// Fracción del ancho del escenario que hay que arrastrar para cambiar de slide al soltar
const UMBRAL_ARRASTRE = 0.12

// ── Composición (en % de la altura del escenario) ─────────────────────────
// Distancia desde arriba a la que va la palabra gigante de fondo
const PALABRA_TOP = 6
// Zona donde se dibuja el producto. Subir PRODUCTO_TOP lo baja y deja más lugar a la palabra
const PRODUCTO_TOP = 16
const PRODUCTO_BOTTOM = 3

// Cada slide mide 76% del escenario y los vecinos se desplazan 72% de su propio ancho
const ESPACIADO = 0.76 * 0.72

// Difuminado de los costados del escenario
const DIFUMINADO_LATERAL =
  'linear-gradient(to right, transparent, black 9%, black 91%, transparent)'

const ESTILOS = `
@keyframes hero-bar-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.hero-bar-in { animation: hero-bar-in 500ms cubic-bezier(0.22, 1, 0.36, 1) both; }
`

// Posición relativa (entera) de un slide respecto al activo: 0 = centro, ±1 = vecinos
function offsetDe(i: number, activo: number, n: number) {
  let d = (i - activo + n) % n
  if (d > n / 2) d -= n
  return d
}

// Estilo según la posición continua del slide (0 = centro, ±1 = vecino, ±2 = oculto).
// Es continua para que el arrastre interpole escala, opacidad y desenfoque.
function estiloSlide(dc: number): CSSProperties {
  const a = Math.min(Math.abs(dc), 2)
  const lado = dc < 0 ? -1 : 1
  const escala = a <= 1 ? 1 - 0.3 * a : 0.7 - 0.2 * (a - 1)
  const opacidad =
    a <= 1 ? 1 - (1 - OPACIDAD_VECINOS) * a : OPACIDAD_VECINOS * (2 - a)
  const desenfoque = a <= 1 ? 3 * a : 3 + 3 * (a - 1)
  const desplazamiento = a <= 1 ? 72 * a : 72 + 18 * (a - 1)

  return {
    transform: `translateX(${lado * desplazamiento}%) scale(${escala})`,
    opacity: opacidad,
    filter: `blur(${desenfoque}px)`,
    zIndex: Math.round(3 - a),
  }
}

export function HeroShowcase({ slides }: Props) {
  const n = slides.length
  const rootRef = useRef<HTMLElement>(null)
  const drag = useRef<{
    id: number
    x0: number
    t0: number
    ancho: number
    activo: boolean
  } | null>(null)
  const huboArrastre = useRef(false)

  // La rotación espera a que el título termine de animarse
  const { tituloListo } = useHeroSync()

  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const [foco, setFoco] = useState(false)
  const [enPantalla, setEnPantalla] = useState(true)
  const [pestanaVisible, setPestanaVisible] = useState(true)
  const [reducido, setReducido] = useState(false)
  // Arrastre: progreso entre -1 y 1 (1 = un slide completo hacia la derecha)
  const [arrastrando, setArrastrando] = useState(false)
  const [arrastre, setArrastre] = useState(0)

  const animar = !(RESPETAR_MOVIMIENTO_REDUCIDO && reducido)
  const corriendo =
    n > 1 &&
    animar &&
    tituloListo &&
    !hover &&
    !foco &&
    !arrastrando &&
    enPantalla &&
    pestanaVisible

  const ir = useCallback((i: number) => setActive(((i % n) + n) % n), [n])
  const siguiente = () => ir(active + 1)
  const anterior = () => ir(active - 1)

  // Preferencia de "reducir movimiento" (y cambios mientras la página está abierta)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const actualizar = () => setReducido(mq.matches)
    actualizar()
    mq.addEventListener('change', actualizar)
    return () => mq.removeEventListener('change', actualizar)
  }, [])

  // Pausa cuando la pestaña no está visible
  useEffect(() => {
    const actualizar = () => setPestanaVisible(document.visibilityState === 'visible')
    actualizar()
    document.addEventListener('visibilitychange', actualizar)
    return () => document.removeEventListener('visibilitychange', actualizar)
  }, [])

  // Pausa cuando el hero sale de la pantalla
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setEnPantalla(entry.isIntersecting), {
      threshold: 0.2,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Rotación automática: un timeout por slide (se reinicia al cambiar manualmente)
  useEffect(() => {
    if (!corriendo) return
    const id = window.setTimeout(() => setActive((a) => (a + 1) % n), INTERVALO_MS)
    return () => window.clearTimeout(id)
  }, [corriendo, active, n])

  function onKeyDown(e: ReactKeyboardEvent<HTMLElement>) {
    if (e.key === 'ArrowRight') siguiente()
    if (e.key === 'ArrowLeft') anterior()
  }

  // ── Arrastre con mouse, lápiz o dedo ──
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (n < 2) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    huboArrastre.current = false
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      t0: performance.now(),
      ancho: e.currentTarget.clientWidth,
      activo: false,
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return

    const dx = e.clientX - d.x0

    if (!d.activo) {
      if (Math.abs(dx) < UMBRAL_INICIO) return
      // Recién ahora se captura el puntero: así un click simple sigue llegando al link
      d.activo = true
      huboArrastre.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setArrastrando(true)
    }

    setArrastre(Math.max(-1, Math.min(1, dx / (d.ancho * ESPACIADO))))
  }

  function terminarArrastre(e: ReactPointerEvent<HTMLDivElement>, cancelado: boolean) {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    drag.current = null
    if (!d.activo) return

    setArrastrando(false)
    setArrastre(0)
    if (cancelado) return

    const dx = e.clientX - d.x0
    const dt = Math.max(performance.now() - d.t0, 1)
    const velocidad = Math.abs(dx) / dt // px por ms
    const suficiente =
      Math.abs(dx) > d.ancho * UMBRAL_ARRASTRE || (velocidad > 0.5 && Math.abs(dx) > 30)

    if (!suficiente) return
    // Arrastrar hacia la derecha trae el anterior; hacia la izquierda, el siguiente
    if (dx < 0) siguiente()
    else anterior()
  }

  // Después de arrastrar no se debe abrir el producto por accidente
  function onClickCapture(e: ReactMouseEvent<HTMLDivElement>) {
    if (!huboArrastre.current) return
    huboArrastre.current = false
    e.preventDefault()
    e.stopPropagation()
  }

  const actual = slides[active]
  const progreso = arrastrando ? arrastre : 0
  const conDescuento = actual.descuento > 0

  const transicionSlide =
    animar && !arrastrando
      ? 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease, filter 700ms ease'
      : 'none'
  const transicionPalabra = animar
    ? 'opacity 600ms ease, transform 700ms cubic-bezier(0.22, 1, 0.36, 1)'
    : 'none'

  return (
    <section
      ref={rootRef}
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      className="relative w-full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFoco(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false)
      }}
      onKeyDown={onKeyDown}
    >
      <style>{ESTILOS}</style>

      {/* Escenario */}
      <div
        className="relative aspect-[16/11] w-full touch-pan-y select-none overflow-hidden [container-type:inline-size]"
        style={{ cursor: n > 1 ? (arrastrando ? 'grabbing' : 'grab') : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => terminarArrastre(e, false)}
        onPointerCancel={(e) => terminarArrastre(e, true)}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Resplandor violeta */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[55%] h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: `radial-gradient(closest-side, rgba(124,58,237,${OPACIDAD_RESPLANDOR}), transparent)`,
          }}
        />

        {/* Palabra gigante de fondo (arriba, para que el teclado no la tape) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0"
          style={{ top: `${PALABRA_TOP}%` }}
        >
          {slides.map((s, i) => {
            const largo = Math.max(s.palabra.length, 3)
            const ajuste = (96 / (largo * 0.8)).toFixed(2)
            return (
              <span
                key={s.id}
                className="absolute inset-x-0 top-0 block select-none whitespace-nowrap text-center font-heading font-bold uppercase leading-none tracking-tight"
                style={{
                  // Mismo violeta que "primary" (#7C3AED)
                  color: `rgb(124 58 237 / ${OPACIDAD_PALABRA})`,
                  fontSize: `min(30cqw, ${ajuste}cqw)`,
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? 'translateY(0)' : 'translateY(14px)',
                  transition: transicionPalabra,
                }}
              >
                {s.palabra}
              </span>
            )
          })}
        </div>

        {/* Sombra en el piso */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[8%] left-1/2 h-[7%] w-[58%] -translate-x-1/2 rounded-[50%]"
          style={{
            background: `radial-gradient(closest-side, rgba(24,24,27,${OPACIDAD_SOMBRA}), transparent)`,
          }}
        />

        {/* Productos (con los costados difuminados) */}
        <div
          className="absolute inset-0"
          style={{ maskImage: DIFUMINADO_LATERAL, WebkitMaskImage: DIFUMINADO_LATERAL }}
        >
          {slides.map((s, i) => {
            const d = offsetDe(i, active, n)
            const esActivo = d === 0
            const esVecino = Math.abs(d) === 1

            // Posición continua: durante el arrastre los slides siguen al cursor
            let dc = d + progreso
            if (n >= 3) {
              if (dc > n / 2) dc -= n
              else if (dc < -n / 2) dc += n
            }

            return (
              <div
                key={s.id}
                aria-hidden={!esActivo}
                className="absolute left-[12%] w-[76%]"
                style={{
                  top: `${PRODUCTO_TOP}%`,
                  bottom: `${PRODUCTO_BOTTOM}%`,
                  ...estiloSlide(dc),
                  transition: transicionSlide,
                  pointerEvents: esActivo || esVecino ? 'auto' : 'none',
                }}
              >
                <Image
                  src={s.imagenUrl}
                  alt={esActivo ? s.nombre : ''}
                  fill
                  priority={i === 0}
                  draggable={false}
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-contain drop-shadow-[0_20px_26px_rgba(24,24,27,0.18)]"
                />

                {esActivo && (
                  <Link
                    href={`/productos/${s.slug}`}
                    aria-label={`Ver ${s.nombre}`}
                    draggable={false}
                    className="absolute inset-0 cursor-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  />
                )}
                {esVecino && (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    onClick={() => ir(i)}
                    className="absolute inset-0 cursor-[inherit]"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Datos del producto */}
      <div
        aria-live={corriendo ? 'off' : 'polite'}
        aria-atomic="true"
        className="mx-auto mt-4 w-full max-w-xl border-t border-primary/15 pt-9"
      >
        {/*
          Dos columnas con la misma estructura (sm en adelante):
            fila 1 (grande)  → nombre            | [etiqueta] [precio anterior] precio
            fila 2 (leyenda) → categoría · marca | precio por transferencia
          Las dos filas comparten línea base. En celular se apila a la izquierda.
        */}
        <Link
          key={actual.id}
          href={`/productos/${actual.slug}`}
          className={`group grid grid-cols-1 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-6 ${animar ? 'hero-bar-in' : ''
            }`}
        >
          {/* Nombre */}
          <div className="flex min-w-0 items-center gap-2 sm:col-start-1 sm:row-start-1">
            <p className="line-clamp-2 font-heading text-xl font-bold uppercase leading-tight transition-colors group-hover:text-primary sm:text-2xl 2xl:text-3xl">
              {actual.nombre}
            </p>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 2xl:h-6 2xl:w-6" />
          </div>

          {/* Categoría y marca */}
          <p className="min-w-0 truncate font-mono text-xs font-medium uppercase tracking-widest text-primary sm:col-start-1 sm:row-start-2 sm:text-sm">
            {VER.numero && `${String(active + 1).padStart(2, '0')} · `}
            {actual.marca ? `${actual.categoria} · ${actual.marca}` : actual.categoria}
          </p>

          {/* Precio (con la etiqueta a la izquierda y el precio anterior a la derecha) */}
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 sm:col-start-2 sm:row-start-1 sm:mt-0 sm:flex-nowrap sm:justify-end">
            {VER.badgeDescuento && conDescuento && (
              <span className="badge-discount self-center">-{actual.descuento}%</span>
            )}
            <span className="font-sans text-2xl font-bold leading-none text-text 2xl:text-3xl">
              ${actual.precioFinal.toLocaleString('es-AR')}
            </span>
            {VER.precioAnterior && conDescuento && (
              <span className="font-mono text-xs text-muted line-through sm:text-sm">
                ${actual.precio.toLocaleString('es-AR')}
              </span>
            )}
          </div>

          {/* Precio por transferencia */}
          {VER.precioTransferencia && actual.precioTransferencia && (
            <p className="font-mono text-sm text-green-600 sm:col-start-2 sm:row-start-2 sm:text-right sm:text-base">
              ${actual.precioTransferencia.toLocaleString('es-AR')} con transferencia
            </p>
          )}
        </Link>
      </div>

      {/* Controles */}
      {n > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {VER.flechas && (
            <button
              type="button"
              onClick={anterior}
              aria-label="Producto anterior"
              className="p-1.5 text-text transition-colors hover:text-primary"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div role="group" aria-label="Elegir producto" className="flex items-center">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Ver ${s.nombre}`}
                aria-current={i === active}
                className="p-1.5"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-primary' : 'w-2 bg-zinc-300 hover:bg-zinc-400'
                    }`}
                />
              </button>
            ))}
          </div>

          {VER.flechas && (
            <button
              type="button"
              onClick={siguiente}
              aria-label="Producto siguiente"
              className="p-1.5 text-text transition-colors hover:text-primary"
            >
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}
    </section>
  )
}