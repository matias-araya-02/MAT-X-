import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ComponentProps } from 'react'
import type { ProductCard } from '@/components/product/ProductCard'

// Mismo tipo que recibe la card, para poder pasarle lo que devuelve la API
export type ProductoFavorito = ComponentProps<typeof ProductCard>['producto']

// Tope de favoritos guardados (el endpoint acepta hasta 100 IDs)
const MAX_FAVORITOS = 100

interface FavoritosState {
  ids: string[] // lo único que se persiste en localStorage
  productos: Record<string, ProductoFavorito> // caché en memoria
  descuentoTransferencia: number
  hidratado: boolean
  cargando: boolean
  error: boolean

  toggle: (id: string) => void
  quitar: (id: string) => void
  cargar: () => Promise<void>
}

export const useFavoritosStore = create<FavoritosState>()(
  persist(
    (set, get) => ({
      ids: [],
      productos: {},
      descuentoTransferencia: 0,
      hidratado: false,
      cargando: false,
      error: false,

      toggle: (id) => {
        // Antes de leer localStorage no se escribe nada, para no pisar lo guardado
        if (!get().hidratado) return
        if (get().ids.includes(id)) {
          get().quitar(id)
          return
        }
        if (get().ids.length >= MAX_FAVORITOS) return
        set((s) => ({ ids: [id, ...s.ids] }))
      },

      quitar: (id) => {
        set((s) => {
          const productos = { ...s.productos }
          delete productos[id]
          return { ids: s.ids.filter((x) => x !== id), productos }
        })
      },

      // Pide solo los productos que todavía no están en la caché
      cargar: async () => {
        const { ids, productos, cargando } = get()
        const faltan = ids.filter((id) => !(id in productos))
        if (cargando || faltan.length === 0) return

        set({ cargando: true, error: false })
        try {
          const res = await fetch('/api/favoritos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: faltan }),
          })
          if (!res.ok) throw new Error('Error al cargar favoritos')

          const data: {
            productos: ProductoFavorito[]
            descuentoTransferencia: number
          } = await res.json()
          const llegaron = new Set(data.productos.map((p) => p.id))

          set((s) => ({
            productos: {
              ...s.productos,
              ...Object.fromEntries(data.productos.map((p) => [p.id, p])),
            },
            descuentoTransferencia: data.descuentoTransferencia,
            // Los que no volvieron (borrados o desactivados) se sacan de la lista
            ids: s.ids.filter((id) => !faltan.includes(id) || llegaron.has(id)),
            cargando: false,
          }))
        } catch {
          set({ cargando: false, error: true })
        }
      },
    }),
    {
      name: 'mat-x-favoritos',
      skipHydration: true,
      partialize: (s) => ({ ids: s.ids }),
      // Si alguien edita localStorage a mano, se descarta lo que no sea un ID válido
      merge: (persisted, current) => {
        const guardados = (persisted as { ids?: unknown } | undefined)?.ids
        const ids = Array.isArray(guardados)
          ? guardados
              .filter((x): x is string => typeof x === 'string')
              .slice(0, MAX_FAVORITOS)
          : current.ids
        return { ...current, ids }
      },
    }
  )
)
