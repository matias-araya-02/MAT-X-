import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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

    const nombreExistente = await prisma.marca.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    })
    if (nombreExistente) {
      return NextResponse.json({ error: 'Ya existe una marca con ese nombre' }, { status: 409 })
    }

    const slugExistente = await prisma.marca.findUnique({ where: { slug } })
    if (slugExistente) {
      return NextResponse.json({ error: 'Ya existe una marca con ese slug' }, { status: 409 })
    }

    const marca = await prisma.marca.create({
      data: {
        nombre,
        slug,
        logoUrl: logoUrl ?? null,
        logoPublicId: logoUrl ? (logoPublicId ?? null) : null,
      },
    })
    return NextResponse.json({ ok: true, marca }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/marcas]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
