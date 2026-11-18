import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductoForm } from '@/components/admin/ProductoForm'

export const metadata: Metadata = { title: 'Nuevo Producto | Admin MAT-X' }

export default async function NuevoProductoPage() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true },
  })

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-6">Nuevo Producto</h1>
      <ProductoForm categorias={categorias} />
    </div>
  )
}
