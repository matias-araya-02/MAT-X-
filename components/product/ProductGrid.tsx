import { ProductCard } from './ProductCard'
import type { ProductoCard } from '@/types'

interface Props {
  productos: ProductoCard[]
}

export function ProductGrid({ productos }: Props) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-mono text-muted text-lg">No hay productos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} />
      ))}
    </div>
  )
}
