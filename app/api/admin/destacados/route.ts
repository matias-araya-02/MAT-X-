import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { eliminarImagen } from '@/lib/cloudinary'
import { destacadosHomeSchema } from '@/lib/validations'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const parsed = destacadosHomeSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    const { slots } = parsed.data

    const anteriores = await prisma.destacadoHome.findMany({
      select: { imagenPublicId: true },
    })

    await prisma.$transaction([
      prisma.destacadoHome.deleteMany(),
      prisma.destacadoHome.createMany({ data: slots }),
    ])

    // Limpieza en Cloudinary de las imágenes que ya no se usan (sin romper si falla)
    const vigentes = new Set(slots.map((s) => s.imagenPublicId))
    await Promise.allSettled(
      anteriores
        .filter((a) => !vigentes.has(a.imagenPublicId))
        .map((a) => eliminarImagen(a.imagenPublicId))
    )

    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PUT /api/admin/destacados]', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
