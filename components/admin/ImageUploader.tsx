'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImagenData {
  id: string
  url: string
  publicId: string
  alt: string
  orden: number
}

interface Props {
  productoId: string
  imagenes: ImagenData[]
  onUpdate: () => void
}

export function ImageUploader({ productoId, imagenes, onUpdate }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      for (const file of Array.from(files)) {
        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('La imagen no puede superar 5MB')
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('productoId', productoId)

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? 'Error al subir imagen')
        }
      }
      onUpdate()
    } catch {
      setError('Error de conexión al subir')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  async function handleDelete(imagenId: string, publicId: string) {
    if (!confirm('¿Eliminar esta imagen?')) return

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenId, publicId }),
      })

      if (res.ok) onUpdate()
    } catch {
      setError('Error al eliminar imagen')
    }
  }

  return (
    <div className="border border-primary/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider">
          Imágenes {imagenes.length > 0 && `(${imagenes.length})`}
        </h3>
      </div>

      {/* Grid de imágenes existentes */}
      {imagenes.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {imagenes.map((img) => (
            <div key={img.id} className="relative group aspect-square bg-background border border-primary/10">
              <Image
                src={img.url}
                alt={img.alt || 'Producto'}
                fill
                className="object-contain p-1"
                sizes="150px"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id, img.publicId)}
                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar"
              >
                ✕
              </button>
              {img.orden === 0 && (
                <span className="absolute bottom-1 left-1 bg-primary text-white font-mono text-[10px] px-1.5 py-0.5">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      <label
        className={`flex flex-col items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary p-6 cursor-pointer transition-colors ${
          uploading ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            <span className="font-mono text-sm text-muted">Subiendo...</span>
          </div>
        ) : (
          <>
            <span className="text-2xl mb-1">📷</span>
            <span className="font-mono text-xs text-muted">
              Click o arrastrá imágenes aquí
            </span>
            <span className="font-mono text-[10px] text-muted mt-1">
              JPG, PNG, WebP · máx 5MB
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && (
        <p className="font-mono text-xs text-red-500 mt-2">⚠️ {error}</p>
      )}
    </div>
  )
}
