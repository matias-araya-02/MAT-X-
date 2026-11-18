import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      ...(typeof body.activo === 'boolean' && { activo: body.activo }),
      ...(typeof body.destacado === 'boolean' && { destacado: body.destacado }),
    },
  })

  return NextResponse.json({ ok: true, activo: producto.activo, destacado: producto.destacado })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.producto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
