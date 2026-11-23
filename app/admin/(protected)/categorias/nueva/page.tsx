import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { CategoriaForm } from '@/components/admin/CategoriaForm'

export const metadata: Metadata = { title: 'Nueva Categoría | Admin MAT-X' }

export default async function NuevaCategoriaPage() {
  // Por defecto, la categoría nueva va al final
  const ultima = await prisma.categoria.aggregate({ _max: { orden: true } })
  const ordenSugerido = (ultima._max.orden ?? -1) + 1

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-6">Nueva categoría</h1>
      <CategoriaForm ordenSugerido={ordenSugerido} />
    </div>
  )
}
