import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const CARPETAS: Record<string, string> = {
  proximamente: 'mat-x/proximamente',
}

// POST /api/upload/sign — genera firma para subida directa a Cloudinary (solo admin)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      folder?: string
      paramsToSign?: Record<string, string | number>
    }

    const folder =
      body.folder && Object.prototype.hasOwnProperty.call(CARPETAS, body.folder)
        ? CARPETAS[body.folder]
        : 'mat-x/proximamente'

    const timestamp = Math.round(Date.now() / 1000)
    const paramsToSign = body.paramsToSign ?? { folder, timestamp }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    })
  } catch (error) {
    console.error('[POST /api/upload/sign]', error)
    return NextResponse.json({ error: 'Error al firmar la subida' }, { status: 500 })
  }
}
