import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productoId: string
  varianteId?: string
  nombre: string
  variante?: string
  precio: number      // precio calculado con descuento (referencia visual; el servidor recalcula)
  cantidad: number
  imagen?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean

  // Acciones
  addItem: (item: Omit<CartItem, 'cantidad'> & { cantidad?: number }) => void
  removeItem: (productoId: string, varianteId?: string) => void
  updateQuantity: (productoId: string, varianteId: string | undefined, cantidad: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void

  // Derivados
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productoId === newItem.productoId &&
              i.varianteId === newItem.varianteId
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productoId === newItem.productoId &&
                i.varianteId === newItem.varianteId
                  ? { ...i, cantidad: i.cantidad + (newItem.cantidad ?? 1) }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { ...newItem, cantidad: newItem.cantidad ?? 1 }],
          }
        })
      },

      removeItem: (productoId, varianteId) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productoId === productoId && i.varianteId === varianteId)
          ),
        }))
      },

      updateQuantity: (productoId, varianteId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId, varianteId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productoId === productoId && i.varianteId === varianteId
              ? { ...i, cantidad }
              : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
      totalPrice: () => get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    }),
    {
      name: 'mat-x-cart',
    }
  )
)
