'use client'

import { Children, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface Props {
    children: ReactNode
    /** Nombre accesible de la región desplazable */
    label?: string
    /**
     * Card fija a la izquierda (en pantallas grandes), del mismo ancho que una card.
     * Con esto se ven 3 cards de producto a su lado en vez de 4.
     */
    lead?: ReactNode
}

// Separación entre cards en px (igual a gap-4)
const GAP = 16

export function ProductCarousel({ children, label = 'Productos', lead }: Props) {
    const scrollerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const drag = useRef<{ startX: number; startScroll: number } | null>(null)
    const rafRef = useRef<number | null>(null)

    const [dragging, setDragging] = useState(false)
    const [animating, setAnimating] = useState(false)
    const [s, setS] = useState({
        overflow: false,
        thumbW: 100,
        thumbL: 0,
        canPrev: false,
        canNext: false,
    })

    const count = Children.count(children)

    // Recalcula el tamaño y la posición de la barra según el scroll
    const update = useCallback(() => {
        const el = scrollerRef.current
        if (!el) return

        const { scrollLeft, scrollWidth, clientWidth } = el
        const overflow = scrollWidth > clientWidth + 1
        const maxScroll = scrollWidth - clientWidth
        const thumbW = overflow ? (clientWidth / scrollWidth) * 100 : 100
        const thumbL =
            overflow && maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - thumbW) : 0

        setS({
            overflow,
            thumbW,
            thumbL,
            canPrev: scrollLeft > 1,
            canNext: scrollLeft < maxScroll - 1,
        })
    }, [])

    // Recalcular al montar, al cambiar la cantidad de productos y al redimensionar
    useEffect(() => {
        const el = scrollerRef.current
        if (!el) return

        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [update, count])

    // Cancelar la animación pendiente al desmontar
    useEffect(
        () => () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        },
        []
    )

    // Ancho de una card + separación
    function getPaso() {
        const el = scrollerRef.current
        const slide = el?.firstElementChild as HTMLElement | null
        return slide ? slide.offsetWidth + GAP : (el?.clientWidth ?? 1)
    }

    function cancelarAnimacion() {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        setAnimating(false)
    }

    // Anima el scroll con easing (duración en ms)
    function animarA(target: number, duration = 500) {
        const el = scrollerRef.current
        if (!el) return

        const maxScroll = el.scrollWidth - el.clientWidth
        const destino = Math.max(0, Math.min(target, maxScroll))
        const inicio = el.scrollLeft
        const delta = destino - inicio
        if (Math.abs(delta) < 1) return

        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        setAnimating(true)

        const t0 = performance.now()
        const ease = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic

        const frame = (now: number) => {
            const p = Math.min((now - t0) / duration, 1)
            el.scrollLeft = inicio + delta * ease(p)
            if (p < 1) {
                rafRef.current = requestAnimationFrame(frame)
            } else {
                rafRef.current = null
                setAnimating(false)
            }
        }
        rafRef.current = requestAnimationFrame(frame)
    }

    // Flechas: avanzan exactamente una card, alineada
    function mover(dir: 1 | -1) {
        const el = scrollerRef.current
        if (!el) return
        const paso = getPaso()
        const idx = Math.round(el.scrollLeft / paso)
        animarA((idx + dir) * paso)
    }

    // Click en la línea: salta suave a la card más cercana a esa posición
    function onTrackDown(e: React.PointerEvent<HTMLDivElement>) {
        const el = scrollerRef.current
        const track = trackRef.current
        if (!el || !track) return
        const rect = track.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        const target = ratio * el.scrollWidth - el.clientWidth / 2
        const paso = getPaso()
        animarA(Math.round(target / paso) * paso, 600)
    }

    // Arrastrar el tramo oscuro de la barra
    function onThumbDown(e: React.PointerEvent<HTMLDivElement>) {
        const el = scrollerRef.current
        if (!el) return
        e.stopPropagation()
        cancelarAnimacion()
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { startX: e.clientX, startScroll: el.scrollLeft }
        setDragging(true)
    }

    function onThumbMove(e: React.PointerEvent<HTMLDivElement>) {
        const el = scrollerRef.current
        const track = trackRef.current
        if (!drag.current || !el || !track) return

        const maxScroll = el.scrollWidth - el.clientWidth
        const movible = track.clientWidth * (1 - s.thumbW / 100)
        if (movible <= 0) return

        const dx = e.clientX - drag.current.startX
        el.scrollLeft = drag.current.startScroll + (dx / movible) * maxScroll
    }

    // Al soltar: se acomoda suave en la card más cercana (en vez de saltar)
    function onThumbUp() {
        const el = scrollerRef.current
        if (el && drag.current) {
            const paso = getPaso()
            animarA(Math.round(el.scrollLeft / paso) * paso, 300)
        }
        drag.current = null
        setDragging(false)
    }

    // Cards por pantalla: sin card fija 2 / 3 / 4; con card fija 2 / 3 / 3 (la fija ocupa la cuarta)
    const anchoCard = lead
        ? 'basis-[calc((100%_-_16px)/2)] md:basis-[calc((100%_-_32px)/3)]'
        : 'basis-[calc((100%_-_16px)/2)] md:basis-[calc((100%_-_32px)/3)] lg:basis-[calc((100%_-_48px)/4)]'

    return (
        <div>
            <div className={lead ? 'lg:flex lg:gap-4' : undefined}>
                {/* Card fija (arriba en pantallas chicas, a la izquierda en grandes) */}
                {lead && (
                    <div className="mb-4 flex flex-col lg:mb-0 lg:w-[calc((100%_-_48px)/4)] lg:flex-none">
                        {lead}
                    </div>
                )}

                <div className={lead ? 'min-w-0 lg:flex-1' : undefined}>
                    {/* Carril de cards */}
                    <div
                        ref={scrollerRef}
                        onScroll={update}
                        onWheel={cancelarAnimacion}
                        onTouchStart={cancelarAnimacion}
                        tabIndex={0}
                        role="region"
                        aria-label={label}
                        className={`flex gap-4 overflow-x-auto focus:outline-none focus-visible:ring-1 focus-visible:ring-primary [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${dragging || animating ? '' : 'snap-x snap-mandatory'
                            }`}
                    >
                        {Children.map(children, (child) => (
                            <div className={`min-w-0 flex-none snap-start flex ${anchoCard}`}>
                                {child}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Barra + flechas (solo si hay más cards de las que entran) */}
            {s.overflow && (
                <div
                    className={`mt-6 flex items-center gap-4 ${lead ? 'lg:pl-[calc((100%_-_48px)/4_+_16px)]' : ''
                        }`}
                >
                    <div
                        ref={trackRef}
                        onPointerDown={onTrackDown}
                        className="relative h-5 flex-1 cursor-pointer"
                    >
                        {/* Línea */}
                        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-primary/20" />

                        {/* Tramo oscuro (arrastrable) */}
                        <div
                            onPointerDown={onThumbDown}
                            onPointerMove={onThumbMove}
                            onPointerUp={onThumbUp}
                            onPointerCancel={onThumbUp}
                            className={`absolute top-0 h-5 touch-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'
                                }`}
                            style={{ left: `${s.thumbL}%`, width: `${s.thumbW}%` }}
                        >
                            <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-primary" />
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => mover(-1)}
                            disabled={!s.canPrev}
                            aria-label="Ver anteriores"
                            className="p-1.5 text-text transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-text"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => mover(1)}
                            disabled={!s.canNext}
                            aria-label="Ver siguientes"
                            className="p-1.5 text-text transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-text"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
