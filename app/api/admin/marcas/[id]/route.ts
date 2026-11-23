import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { cloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const MarcaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre es demasiado largo'),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es obligatorio')
    .max(100, 'El slug es demasiado largo')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede tener minúsculas, números y guiones'),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((u) => u.startsWith('https://res.cloudinary.com/'), 'Logo inválido')
    .nullable()
    .optional(),
  logoPublicId: z.string().trim().max(300).nullable().optional(),
})

// Borra un logo de Cloudinary sin romper la operación si falla
async function borrarLogo(publicId?: string | null) {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('[cloudinary destroy]', error)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = MarcaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { nombre, slug, logoUrl, logoPublicId } = parsed.data

    const existente = await prisma.marca.findUnique({ where: { id } })
    if (!existente) {
      return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 })
    }

    const nombreDuplicado = await prisma.marca.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' }, NOT: { id } },
    })
    if (nombreDuplicado) {
      return NextResponse.json({ error: 'Ya existe otra marca con ese nombre' }, { status: 409 })
    }

    const slugDuplicado = await prisma.marca.findFirst({
      where: { slug, NOT: { id } },
    })
    if (slugDuplicado) {
      return NextResponse.json({ error: 'Ya existe otra marca con ese slug' }, { status: 409 })
    }

    // logoUrl undefined = no tocar el logo; null = quitarlo
    const data: {
      nombre: string
      slug: string
      logoUrl?: string | null
      logoPublicId?: string | null
    } = { nombre, slug }

    if (logoUrl !== undefined) {
      data.logoUrl = logoUrl
      data.logoPublicId = logoUrl ? (logoPublicId ?? null) : null
    }

    const marca = await prisma.marca.update({ where: { id }, data })

    // Si el logo cambió o se quitó, borrar el anterior de Cloudinary
    if (
      logoUrl !== undefined &&
      existente.logoPublicId &&
      existente.logoPublicId !== marca.logoPublicId
    ) {
      await borrarLogo(existente.logoPublicId)
    }

    return NextResponse.json({ ok: true, marca })
  } catch (error) {
    console.error('[PATCH /api/admin/marcas/[id]]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const marca = await prisma.marca.findUnique({
      where: { id },
      include: { _count: { select: { productos: true } } },
    })
    if (!marca) {
      return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 })
    }

    const cantidad = marca._count.productos
    if (cantidad > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: ${cantidad} producto${cantidad !== 1 ? 's usan' : ' usa'} esta marca. Cambiá la marca de esos productos primero.`,
        },
        { status: 409 }
      )
    }

    await prisma.marca.delete({ where: { id } })
    await borrarLogo(marca.logoPublicId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/admin/marcas/[id]]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
