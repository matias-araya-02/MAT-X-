import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { eliminarImagen } from '@/lib/cloudinary'
import { z } from 'zod'

const MAX_SLIDES = 7

const SlideSchema = z.object({
  productoId: z.string().min(1, 'Falta elegir el producto en un slide'),
  palabra: z
    .string()
    .trim()
    .max(14, 'La palabra de fondo admite hasta 14 caracteres')
    .nullable()
    .optional(),
  activo: z.boolean(),
  imagenUrl: z
    .string()
    .trim()
    .max(500)
    .refine((u) => u.startsWith('https://res.cloudinary.com/'), 'Imagen inválida'),
  imagenPublicId: z.string().trim().min(1).max(300),
})

const BodySchema = z.object({
  slides: z.array(SlideSchema).max(MAX_SLIDES, `Máximo ${MAX_SLIDES} slides`),
})

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }
    const { slides } = parsed.data

    // Los productos elegidos tienen que existir
    const ids = [...new Set(slides.map((s) => s.productoId))]
    const existentes = await prisma.producto.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })
    if (existentes.length !== ids.length) {
      return NextResponse.json(
        { error: 'Uno de los productos elegidos ya no existe' },
        { status: 400 }
      )
    }

    const anteriores = await prisma.heroSlide.findMany({
      select: { imagenPublicId: true },
    })

    await prisma.$transaction([
      prisma.heroSlide.deleteMany(),
      prisma.heroSlide.createMany({
        data: slides.map((s, i) => ({
          orden: i,
          productoId: s.productoId,
          palabra: s.palabra?.trim() || null,
          activo: s.activo,
          imagenUrl: s.imagenUrl,
          imagenPublicId: s.imagenPublicId,
        })),
      }),
    ])

    // Limpieza en Cloudinary de las imágenes que ya no se usan (sin romper si falla)
    const vigentes = new Set(slides.map((s) => s.imagenPublicId))
    await Promise.allSettled(
      anteriores
        .filter((a) => !vigentes.has(a.imagenPublicId))
        .map((a) => eliminarImagen(a.imagenPublicId))
    )

    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PUT /api/admin/hero]', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
