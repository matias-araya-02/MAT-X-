'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from './ImageUploader'

interface ImagenData {
  id: string
  url: string
  publicId: string
  alt: string
  orden: number
}

interface Props {
  productoId: string
  imagenesIniciales: ImagenData[]
}

export function ImageUploadSection({ productoId, imagenesIniciales }: Props) {
  const router = useRouter()
  const [imagenes, setImagenes] = useState(imagenesIniciales)

  async function refresh() {
    // Recargar imágenes desde el servidor
    const res = await fetch(`/api/admin/productos/${productoId}`)
    if (res.ok) {
      const producto = await res.json()
      setImagenes(
        (producto.imagenes ?? []).map((img: ImagenData) => ({
          id: img.id,
          url: img.url,
          publicId: img.publicId,
          alt: img.alt ?? '',
          orden: img.orden,
        }))
      )
    }
    router.refresh()
  }

  return (
    <ImageUploader
      productoId={productoId}
      imagenes={imagenes}
      onUpdate={refresh}
    />
  )
}
