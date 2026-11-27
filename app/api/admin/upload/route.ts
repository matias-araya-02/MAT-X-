import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { cloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'

// Carpetas de Cloudinary permitidas (cualquier otro valor cae en productos)
const CARPETAS: Record<string, string> = {
  marcas: 'mat-x/marcas',
  destacados: 'mat-x/destacados',
  categorias: 'mat-x/categorias',
  banner: 'mat-x/banner',
  hero: 'mat-x/hero',
  proximamente: 'mat-x/proximamente',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const productoId = formData.get('productoId') as string | null
    const folderParam = formData.get('folder') as string | null

    // Carpeta de destino en Cloudinary (solo valores permitidos)
    const folder =
      folderParam && Object.prototype.hasOwnProperty.call(CARPETAS, folderParam)
        ? CARPETAS[folderParam]
        : 'mat-x/productos'

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    }

    const esSvg = file.type === 'image/svg+xml'

    // Convertir File a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir a Cloudinary
    const result = await new Promise<{
      public_id: string
      secure_url: string
      width: number
      height: number
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'image',
            // El SVG se guarda sin transformaciones para que siga siendo vectorial
            ...(esSvg ? {} : { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }),
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result as never)
          }
        )
        .end(buffer)
    })

    // Si se proporcionó productoId, guardar la imagen en la DB
    let imagen = null
    if (productoId) {
      const count = await prisma.imagen.count({ where: { productoId } })
      imagen = await prisma.imagen.create({
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          alt: '',
          orden: count,
          productoId,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      imagen,
    })
  } catch (error) {
    console.error('[POST /api/admin/upload]', error)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}

// DELETE — eliminar imagen de Cloudinary y DB
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { imagenId, publicId, resourceType } = await req.json()

    // Eliminar de Cloudinary
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType === 'video' ? 'video' : 'image',
      })
    }

    // Eliminar de DB
    if (imagenId) {
      await prisma.imagen.delete({ where: { id: imagenId } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/admin/upload]', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
