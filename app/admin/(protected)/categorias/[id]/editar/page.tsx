import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CategoriaForm } from '@/components/admin/CategoriaForm'

export const metadata: Metadata = { title: 'Editar Categoría | Admin MAT-X' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarCategoriaPage({ params }: Props) {
  const { id } = await params

  const categoria = await prisma.categoria.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      slug: true,
      descripcion: true,
      imagenUrl: true,
      imagenPublicId: true,
      imagenEscala: true,
      orden: true,
    },
  })

  if (!categoria) notFound()

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-6">
        Editar: {categoria.nombre}
      </h1>
      <CategoriaForm categoria={categoria} />
    </div>
  )
}
