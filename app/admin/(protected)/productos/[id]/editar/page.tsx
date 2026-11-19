import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProductoForm } from '@/components/admin/ProductoForm'
import { ImageUploadSection } from '@/components/admin/ImageUploadSection'

export const metadata: Metadata = { title: 'Editar Producto | Admin MAT-X' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params

  const [producto, categorias] = await Promise.all([
    prisma.producto.findUnique({
      where: { id },
      include: { variantes: true, imagenes: { orderBy: { orden: 'asc' } } },
    }),
    prisma.categoria.findMany({
      orderBy: { orden: 'asc' },
      select: { id: true, nombre: true },
    }),
  ])

  if (!producto) notFound()

  const productoData = {
    id: producto.id,
    nombre: producto.nombre,
    slug: producto.slug,
    marca: producto.marca ?? '',
    sku: producto.sku ?? '',
    descripcion: producto.descripcion ?? '',
    precio: producto.precio,
    descuento: producto.descuento ?? 0,
    stock: producto.stock,
    activo: producto.activo,
    destacado: producto.destacado,
    categoriaId: producto.categoriaId,
    variantes: producto.variantes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      precio: v.precio,
      stock: v.stock,
    })),
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-6">
        Editar: {producto.nombre}
      </h1>

      {/* Imágenes */}
      <div className="mb-8">
        <ImageUploadSection
          productoId={producto.id}
          imagenesIniciales={producto.imagenes.map((img) => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
            alt: img.alt ?? '',
            orden: img.orden,
          }))}
        />
      </div>

      {/* Formulario de datos */}
      <ProductoForm categorias={categorias} producto={productoData} />
    </div>
  )
}
