'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ImagePlus, X } from 'lucide-react'

interface MarcaData {
  id?: string
  nombre: string
  slug: string
  logoUrl?: string | null
  logoPublicId?: string | null
}

interface Props {
  marca?: MarcaData
}

// Logo ya guardado en la marca
interface LogoGuardado {
  url: string
  publicId: string | null
}

// Logo elegido pero todavía sin subir
interface LogoNuevo {
  file: File
  preview: string
}

// Resultado de subir el logo nuevo a Cloudinary
interface LogoSubido {
  url: string
  publicId: string
}

const MAX_BYTES = 2 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/png', 'image/webp', 'image/jpeg']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Borra de Cloudinary un logo subido que ya no se va a usar (sin romper si falla)
async function borrarSubido(publicId: string) {
  try {
    await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    })
  } catch {
    /* best-effort */
  }
}

export function MarcaForm({ marca }: Props) {
  const router = useRouter()
  const isEditing = !!marca?.id

  const [nombre, setNombre] = useState(marca?.nombre ?? '')
  const [slug, setSlug] = useState(marca?.slug ?? '')
  const [autoSlug, setAutoSlug] = useState(!isEditing)
  const [loading, setLoading] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Logo
  const [logoActual, setLogoActual] = useState<LogoGuardado | null>(
    marca?.logoUrl ? { url: marca.logoUrl, publicId: marca.logoPublicId ?? null } : null
  )
  const [logoNuevo, setLogoNuevo] = useState<LogoNuevo | null>(null)
  const [logoSubido, setLogoSubido] = useState<LogoSubido | null>(null)
  const [errorLogo, setErrorLogo] = useState<string | null>(null)

  // Liberar la vista previa al salir del formulario
  const previewRef = useRef<string | null>(null)
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  function onNombreChange(value: string) {
    setNombre(value)
    if (autoSlug) setSlug(slugify(value))
  }

  function elegirLogo(file: File | undefined) {
    if (!file) return

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setErrorLogo('Formato no permitido. Usá PNG, WebP o JPG.')
      return
    }
    if (file.size > MAX_BYTES) {
      setErrorLogo('El logo no puede superar 2MB')
      return
    }

    setErrorLogo(null)
    if (logoNuevo) URL.revokeObjectURL(logoNuevo.preview)

    // Si ya se había subido otro logo en un intento anterior, se descarta
    if (logoSubido) {
      void borrarSubido(logoSubido.publicId)
      setLogoSubido(null)
    }

    const preview = URL.createObjectURL(file)
    previewRef.current = preview
    setLogoNuevo({ file, preview })
  }

  function quitarLogo() {
    if (logoNuevo) URL.revokeObjectURL(logoNuevo.preview)
    previewRef.current = null

    if (logoSubido) {
      void borrarSubido(logoSubido.publicId)
      setLogoSubido(null)
    }

    setLogoNuevo(null)
    setLogoActual(null) // al guardar, el logo guardado se elimina
    setErrorLogo(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Logo que se va a guardar: el ya existente o el nuevo (que se sube ahora)
      let logo: { url: string; publicId: string | null } | null = logoActual

      if (logoNuevo) {
        let subido = logoSubido

        if (!subido) {
          setProgreso('Subiendo logo...')

          const fd = new FormData()
          fd.append('file', logoNuevo.file)
          fd.append('folder', 'marcas')

          const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          const upData = await up.json()

          if (!up.ok) {
            setError(upData.error ?? 'Error al subir el logo')
            return
          }

          subido = { url: upData.url, publicId: upData.publicId }
          setLogoSubido(subido)
        }

        logo = subido
      }

      setProgreso('Guardando...')

      const res = await fetch(
        isEditing ? `/api/admin/marcas/${marca!.id}` : '/api/admin/marcas',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            slug,
            logoUrl: logo?.url ?? null,
            logoPublicId: logo?.publicId ?? null,
          }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
        return
      }

      router.push('/admin/marcas')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
      setProgreso('')
    }
  }

  const logoMostrado = logoNuevo?.preview ?? logoActual?.url ?? null

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 font-mono text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Nombre *
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => onNombreChange(e.target.value)}
          required
          maxLength={100}
          className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
          placeholder="Attack Shark"
        />
      </div>

      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Slug (URL) *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setAutoSlug(false)
              setSlug(e.target.value)
            }}
            required
            maxLength={100}
            className="flex-1 bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="attack-shark"
          />
          {!autoSlug && (
            <button
              type="button"
              onClick={() => {
                setAutoSlug(true)
                setSlug(slugify(nombre))
              }}
              className="font-mono text-xs text-primary px-2 hover:underline whitespace-nowrap"
            >
              Auto
            </button>
          )}
        </div>
        <p className="font-mono text-xs text-muted mt-1">
          Se usa en los filtros de la tienda: /productos?marca={slug || 'slug'}
        </p>
      </div>

      {/* Logo */}
      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Logo
        </label>

        <div className="flex items-center gap-4">
          <div className="relative flex h-24 w-48 items-center justify-center border border-primary/20 bg-white">
            {logoMostrado ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoMostrado}
                alt={nombre ? `Logo de ${nombre}` : 'Logo'}
                className="absolute inset-0 h-full w-full object-contain p-2"
              />
            ) : (
              <span className="font-mono text-xs text-muted">Sin logo</span>
            )}
          </div>

          <div className="flex flex-col items-start gap-2">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 border border-primary/30 px-3 py-2 font-mono text-xs text-primary transition-colors hover:border-primary ${
                loading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <ImagePlus size={14} />
              {logoMostrado ? 'Cambiar logo' : 'Elegir logo'}
              <input
                type="file"
                accept="image/png,image/webp,image/jpeg"
                disabled={loading}
                onChange={(e) => {
                  elegirLogo(e.target.files?.[0])
                  e.target.value = ''
                }}
                className="hidden"
              />
            </label>

            {logoMostrado && (
              <button
                type="button"
                onClick={quitarLogo}
                disabled={loading}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                <X size={12} />
                Quitar logo
              </button>
            )}
          </div>
        </div>

        <p className="font-mono text-xs text-muted mt-2">
          PNG o WebP con fondo transparente, en formato horizontal · máx 2MB
        </p>

        {errorLogo && (
          <p className="flex items-center gap-1.5 font-mono text-xs text-red-500 mt-2">
            <AlertTriangle size={12} className="flex-shrink-0" />
            {errorLogo}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-8 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? progreso || 'Guardando...'
            : isEditing
              ? 'Guardar cambios'
              : 'Crear marca'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/marcas')}
          disabled={loading}
          className="font-mono text-sm text-muted hover:text-text px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
