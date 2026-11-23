'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

interface Props {
  categorias: { nombre: string; slug: string; count: number }[]
  marcas: { nombre: string; slug: string; count: number }[]
  precioMin: number
  precioMax: number
}

const lista = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b border-primary/20 py-4 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between font-heading text-sm font-bold uppercase tracking-wider [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

export function FiltrosSidebar({ categorias, marcas, precioMin, precioMax }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [abierto, setAbierto] = useState(false)

  const categoriasSel = lista(params.get('categoria'))
  const marcasSel = lista(params.get('marca'))

  const [min, setMin] = useState(params.get('min') ?? '')
  const [max, setMax] = useState(params.get('max') ?? '')

  // Mantiene los inputs de precio sincronizados con la URL (ej: al limpiar filtros)
  useEffect(() => {
    setMin(params.get('min') ?? '')
    setMax(params.get('max') ?? '')
  }, [params])

  const cantidadActivos =
    categoriasSel.length + marcasSel.length + (params.get('min') ? 1 : 0) + (params.get('max') ? 1 : 0)

  function navegar(cambios: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) next.set(clave, valor)
      else next.delete(clave)
    }
    const qs = next.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  function toggle(clave: string, valor: string, actuales: string[]) {
    const nuevos = actuales.includes(valor)
      ? actuales.filter((v) => v !== valor)
      : [...actuales, valor]
    navegar({ [clave]: nuevos.length ? nuevos.join(',') : null })
  }

  function aplicarPrecio() {
    navegar({ min: min || null, max: max || null })
  }

  function limpiar() {
    navegar({ categoria: null, marca: null, min: null, max: null })
  }

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-64">
      {/* Botón para mobile */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="btn-outline mb-4 flex w-full items-center justify-center gap-2 !py-2 text-sm lg:hidden"
        aria-expanded={abierto}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros{cantidadActivos > 0 && ` (${cantidadActivos})`}
      </button>

      <div
        className={`${abierto ? 'block' : 'hidden'} border border-primary/20 bg-white transition-opacity lg:block ${
          isPending ? 'opacity-60' : ''
        }`}
      >
        <div className="card-label flex items-center justify-between">
          <span>Filtros</span>
          {cantidadActivos > 0 && (
            <button
              type="button"
              onClick={limpiar}
              className="font-mono text-[11px] uppercase tracking-wider underline-offset-2 hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="px-5">
          {/* Categoría */}
          <Grupo titulo="Categoría">
            <ul className="space-y-2">
              {categorias.map((cat) => (
                <li key={cat.slug}>
                  <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-muted transition-colors hover:text-text">
                    <input
                      type="checkbox"
                      checked={categoriasSel.includes(cat.slug)}
                      onChange={() => toggle('categoria', cat.slug, categoriasSel)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="flex-1">{cat.nombre}</span>
                    <span className="font-mono text-xs">({cat.count})</span>
                  </label>
                </li>
              ))}
            </ul>
          </Grupo>

          {/* Marca */}
          {marcas.length > 0 && (
            <Grupo titulo="Marca">
              <ul className="space-y-2">
                {marcas.map((m) => (
                  <li key={m.slug}>
                    <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-muted transition-colors hover:text-text">
                      <input
                        type="checkbox"
                        checked={marcasSel.includes(m.slug)}
                        onChange={() => toggle('marca', m.slug, marcasSel)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="flex-1">{m.nombre}</span>
                      <span className="font-mono text-xs">({m.count})</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Grupo>
          )}

          {/* Precio */}
          <Grupo titulo="Precio">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder={`$${precioMin.toLocaleString('es-AR')}`}
                value={min}
                onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && aplicarPrecio()}
                aria-label="Precio mínimo"
                className="w-full border border-primary/30 bg-background px-2 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
              />
              <span className="text-muted">–</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={`$${precioMax.toLocaleString('es-AR')}`}
                value={max}
                onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && aplicarPrecio()}
                aria-label="Precio máximo"
                className="w-full border border-primary/30 bg-background px-2 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={aplicarPrecio}
              className="btn-outline mt-3 w-full !py-2 text-xs"
            >
              Aplicar
            </button>
          </Grupo>
        </div>
      </div>
    </aside>
  )
}
