import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MarcaForm } from '@/components/admin/MarcaForm'

export const metadata: Metadata = { title: 'Editar Marca | Admin MAT-X' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarMarcaPage({ params }: Props) {
  const { id } = await params

  const marca = await prisma.marca.findUnique({
    where: { id },
    select: { id: true, nombre: true, slug: true, logoUrl: true, logoPublicId: true, logoEscala: true },
  })

  if (!marca) notFound()

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-6">
        Editar: {marca.nombre}
      </h1>
      <MarcaForm marca={marca} />
    </div>
  )
}
