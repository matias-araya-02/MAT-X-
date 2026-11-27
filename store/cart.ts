import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productoId: string
  varianteId?: string
  nombre: string
  variante?: string
  precio: number      // precio calculado con descuento (referencia visual; el servidor recalcula)
  cantidad: number
  stock?: number      // stock disponible al agregar; limita el incremento en el carrito
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

function limitarPorStock(cantidad: number, stock?: number) {
  if (stock === undefined) return cantidad
  return Math.max(0, Math.min(cantidad, stock))
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const cantidadSumar = newItem.cantidad ?? 1
          const existing = state.items.find(
            (i) =>
              i.productoId === newItem.productoId &&
              i.varianteId === newItem.varianteId
          )
          if (existing) {
            const stock = newItem.stock ?? existing.stock
            const nuevaCantidad = limitarPorStock(existing.cantidad + cantidadSumar, stock)
            if (nuevaCantidad <= 0) return state
            return {
              items: state.items.map((i) =>
                i.productoId === newItem.productoId &&
                i.varianteId === newItem.varianteId
                  ? { ...i, stock, cantidad: nuevaCantidad }
                  : i
              ),
            }
          }
          const inicial = limitarPorStock(cantidadSumar, newItem.stock)
          if (inicial <= 0) return state
          return {
            items: [...state.items, { ...newItem, cantidad: inicial }],
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
          items: state.items.map((i) => {
            if (i.productoId !== productoId || i.varianteId !== varianteId) return i
            const limitada = limitarPorStock(cantidad, i.stock)
            return { ...i, cantidad: Math.max(1, limitada) }
          }),
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
