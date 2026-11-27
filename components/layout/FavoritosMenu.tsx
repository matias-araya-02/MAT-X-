'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useFavoritosStore } from '@/store/favoritos'
import { calcularPrecioFinal } from '@/lib/pricing'
import { PixelHeart } from '@/components/product/PixelHeart'

function Contador({ n }: { n: number }) {
  if (n === 0) return null
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
      {n}
    </span>
  )
}

export function FavoritosMenu() {
  const pathname = usePathname()
  const rootRef = useRef<HTMLDivElement>(null)
  const [abierto, setAbierto] = useState(false)

  const hidratado = useFavoritosStore((s) => s.hidratado)
  const ids = useFavoritosStore((s) => s.ids)
  const productos = useFavoritosStore((s) => s.productos)
  const cargando = useFavoritosStore((s) => s.cargando)
  const error = useFavoritosStore((s) => s.error)
  const cargar = useFavoritosStore((s) => s.cargar)
  const quitar = useFavoritosStore((s) => s.quitar)

  const cantidad = ids.length
  const lista = ids.flatMap((id) => (productos[id] ? [productos[id]] : []))

  // Se cierra al cambiar de página
  useEffect(() => setAbierto(false), [pathname])

  // Se cierra con Escape y con un click afuera
  useEffect(() => {
    if (!abierto) return
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setAbierto(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [abierto])

  // Trae los datos de los favoritos solo cuando se abre el panel
  useEffect(() => {
    if (abierto && hidratado && !error) cargar()
  }, [abierto, hidratado, error, ids, cargando, cargar])

  const label = `Favoritos${cantidad > 0 ? ` (${cantidad})` : ''}`

  return (
    <div ref={rootRef} className="relative">
      {/* Mobile: va directo a la página */}
      <Link
        href="/favoritos"
        aria-label={label}
        className="relative flex p-2 text-muted transition-colors hover:text-primary md:hidden"
      >
        <PixelHeart size={22} filled={cantidad > 0} className={cantidad > 0 ? 'text-primary' : ''} />
        <Contador n={cantidad} />
      </Link>

      {/* Desktop: abre el panel */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={label}
        aria-expanded={abierto}
        aria-haspopup="true"
        className="relative hidden p-2 text-muted transition-colors hover:text-primary md:flex"
      >
        <PixelHeart size={22} filled={cantidad > 0} className={cantidad > 0 ? 'text-primary' : ''} />
        <Contador n={cantidad} />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Favoritos"
          className="absolute right-0 top-full z-40 mt-2 hidden w-[22rem] border border-primary/20 bg-background shadow-xl md:block"
        >
          <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider">
              Favoritos
            </h2>
            <span className="font-mono text-xs text-muted">
              {cantidad} producto{cantidad !== 1 ? 's' : ''}
            </span>
          </div>

          {cantidad === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-sm text-muted">
                Todavía no guardaste nada.
              </p>
              <Link
                href="/productos"
                className="mt-3 inline-block font-mono text-xs uppercase tracking-wider text-primary hover:underline"
              >
                Ver productos
              </Link>
            </div>
          ) : (
            <>
              <ul
                data-lenis-prevent
                className="max-h-80 divide-y divide-primary/10 overflow-y-auto"
              >
                {lista.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-3">
                    <Link
                      href={`/productos/${p.slug}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <div className="relative h-14 w-14 shrink-0 border border-primary/10 bg-white">
                        {p.imagenes[0] && (
                          <Image
                            src={p.imagenes[0].url}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-contain p-1"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-heading text-sm font-bold leading-tight">
                          {p.nombre}
                        </p>
                        <p className="mt-1 font-sans text-sm font-bold text-text">
                          ${calcularPrecioFinal(p.precio, p.descuento).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => quitar(p.id)}
                      aria-label={`Quitar ${p.nombre} de favoritos`}
                      className="shrink-0 p-1.5 text-muted transition-colors hover:text-primary"
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  </li>
                ))}

                {cargando && lista.length < cantidad && (
                  <li className="p-3">
                    <div className="h-14 animate-pulse bg-surface" />
                  </li>
                )}
              </ul>

              {error && (
                <p className="border-t border-primary/10 px-4 py-2 font-mono text-xs text-red-500">
                  No pudimos cargar tus favoritos.
                </p>
              )}

              <div className="border-t border-primary/10 p-3">
                <Link href="/favoritos" className="btn-primary block text-center">
                  Ver todos los favoritos
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
