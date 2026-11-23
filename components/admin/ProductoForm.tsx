'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Camera, Check, X } from 'lucide-react'

interface Variante {
  id?: string
  nombre: string
  precio: number | null
  stock: number
}

interface Categoria {
  id: string
  nombre: string
}

interface Marca {
  id: string
  nombre: string
}

interface ProductoData {
  id?: string
  nombre: string
  slug: string
  marcaId: string // '' = sin marca
  sku: string
  descripcion: string
  precio: number
  descuento: number
  stock: number
  activo: boolean
  destacado: boolean
  categoriaId: string
  variantes: Variante[]
}

// Imagen elegida en "Nuevo producto", todavía sin subir
interface ImagenPendiente {
  id: string
  file: File
  preview: string
  subida: boolean
}

interface Props {
  categorias: Categoria[]
  marcas: Marca[]
  producto?: ProductoData
}

const MAX_BYTES = 5 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ProductoForm({ categorias, marcas, producto }: Props) {
  const router = useRouter()
  const isEditing = !!producto?.id

  const [form, setForm] = useState<ProductoData>({
    nombre: producto?.nombre ?? '',
    slug: producto?.slug ?? '',
    marcaId: producto?.marcaId ?? '',
    sku: producto?.sku ?? '',
    descripcion: producto?.descripcion ?? '',
    precio: producto?.precio ?? 0,
    descuento: producto?.descuento ?? 0,
    stock: producto?.stock ?? 0,
    activo: producto?.activo ?? true,
    destacado: producto?.destacado ?? false,
    categoriaId: producto?.categoriaId ?? categorias[0]?.id ?? '',
    variantes: producto?.variantes ?? [],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSlug, setAutoSlug] = useState(!isEditing)

  // Imágenes (solo al crear; al editar se manejan en ImageUploadSection)
  const [pendientes, setPendientes] = useState<ImagenPendiente[]>([])
  const [errorImagenes, setErrorImagenes] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [progreso, setProgreso] = useState('')

  // Producto ya creado (por si hay que reintentar solo la subida de imágenes)
  const [creado, setCreado] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  // Liberar las vistas previas al salir del formulario
  const pendientesRef = useRef(pendientes)
  pendientesRef.current = pendientes
  useEffect(() => {
    return () => pendientesRef.current.forEach((p) => URL.revokeObjectURL(p.preview))
  }, [])

  function updateField<K extends keyof ProductoData>(key: K, value: ProductoData[K]) {
    setForm((f) => {
      const updated = { ...f, [key]: value }
      if (key === 'nombre' && autoSlug) {
        updated.slug = slugify(value as string)
      }
      return updated
    })
  }

  // Variantes
  function addVariante() {
    setForm((f) => ({
      ...f,
      variantes: [...f.variantes, { nombre: '', precio: null, stock: 0 }],
    }))
  }

  function updateVariante(index: number, field: keyof Variante, value: string | number | null) {
    setForm((f) => ({
      ...f,
      variantes: f.variantes.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  function removeVariante(index: number) {
    setForm((f) => ({
      ...f,
      variantes: f.variantes.filter((_, i) => i !== index),
    }))
  }

  // Imágenes pendientes
  function agregarArchivos(files: File[]) {
    const errores: string[] = []
    const nuevos: ImagenPendiente[] = []

    for (const file of files) {
      if (!TIPOS_PERMITIDOS.includes(file.type)) {
        errores.push(`${file.name}: formato no permitido`)
        continue
      }
      if (file.size > MAX_BYTES) {
        errores.push(`${file.name}: supera 5MB`)
        continue
      }
      nuevos.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        subida: false,
      })
    }

    if (nuevos.length > 0) setPendientes((p) => [...p, ...nuevos])
    setErrorImagenes(errores.length > 0 ? errores.join(' · ') : null)
  }

  function quitarPendiente(id: string) {
    setPendientes((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // ── Edición: igual que antes (las imágenes se manejan aparte) ──
      if (isEditing) {
        const payload = {
          ...form,
          marcaId: form.marcaId || null,
          sku: form.sku || null,
          descripcion: form.descripcion || null,
          descuento: form.descuento || null,
          variantes: form.variantes.length > 0 ? form.variantes : [],
        }

        const res = await fetch(`/api/admin/productos/${producto!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Error al guardar')
          return
        }

        router.push('/admin/productos')
        router.refresh()
        return
      }

      // ── Creación ──
      // Caso raro: el producto ya se creó pero no se pudo leer su id
      if (creado && !createdId) {
        router.push('/admin/productos')
        router.refresh()
        return
      }

      let productoId = createdId

      // 1) Crear el producto (se salta si es un reintento de subida)
      if (!productoId) {
        setProgreso('Creando producto...')

        const payload = {
          ...form,
          marcaId: form.marcaId || null,
          sku: form.sku || null,
          descripcion: form.descripcion || null,
          descuento: form.descuento || null,
          variantes: form.variantes.length > 0 ? form.variantes : [],
        }

        const res = await fetch('/api/admin/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Error al guardar')
          return
        }

        setCreado(true)
        productoId = data.producto?.id ?? data.id ?? null
        setCreatedId(productoId)

        if (!productoId && pendientes.length > 0) {
          setError(
            'El producto se creó, pero no pude obtener su id para subir las imágenes. Cargalas desde la pantalla de edición.'
          )
          return
        }
      }

      // 2) Subir las imágenes pendientes, en orden (la primera queda como principal)
      const porSubir = pendientes.filter((p) => !p.subida)
      const fallidas: string[] = []

      for (let i = 0; i < porSubir.length; i++) {
        const item = porSubir[i]
        setProgreso(`Subiendo imágenes (${i + 1}/${porSubir.length})...`)

        const fd = new FormData()
        fd.append('file', item.file)
        fd.append('productoId', productoId!)

        try {
          const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          if (res.ok) {
            setPendientes((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, subida: true } : p))
            )
          } else {
            fallidas.push(item.file.name)
          }
        } catch {
          fallidas.push(item.file.name)
        }
      }

      if (fallidas.length > 0) {
        setError(
          `El producto se creó, pero no se pudieron subir: ${fallidas.join(', ')}. ` +
            'Podés reintentar con el botón o cargarlas desde la edición del producto.'
        )
        return
      }

      router.push('/admin/productos')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
      setProgreso('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 font-mono text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Imágenes (solo al crear) */}
      {!isEditing && (
        <div className="border border-primary/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider">
              Imágenes {pendientes.length > 0 && `(${pendientes.length})`}
            </h3>
          </div>

          {pendientes.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {pendientes.map((img, i) => (
                <div
                  key={img.id}
                  className="relative group aspect-square bg-background border border-primary/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt={img.file.name}
                    className="absolute inset-0 h-full w-full object-contain p-1"
                  />
                  {!img.subida && !loading && (
                    <button
                      type="button"
                      onClick={() => quitarPendiente(img.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Quitar"
                      aria-label={`Quitar ${img.file.name}`}
                    >
                      <X size={12} />
                    </button>
                  )}
                  {img.subida && (
                    <span className="absolute top-1 right-1 bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-primary text-white font-mono text-[10px] px-1.5 py-0.5">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <label
            onDragOver={(e) => {
              e.preventDefault()
              setArrastrando(true)
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault()
              setArrastrando(false)
              agregarArchivos(Array.from(e.dataTransfer.files))
            }}
            className={`flex flex-col items-center justify-center border-2 border-dashed p-6 cursor-pointer transition-colors ${
              arrastrando ? 'border-primary bg-primary/5' : 'border-primary/30 hover:border-primary'
            } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Camera size={24} className="mb-1 text-primary" />
            <span className="font-mono text-xs text-muted">
              Click o arrastrá imágenes aquí
            </span>
            <span className="font-mono text-[10px] text-muted mt-1">
              JPG, PNG, WebP · máx 5MB · la primera es la principal
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={loading}
              onChange={(e) => {
                agregarArchivos(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
              className="hidden"
            />
          </label>

          {errorImagenes && (
            <p className="flex items-center gap-1.5 font-mono text-xs text-red-500 mt-2">
              <AlertTriangle size={12} className="flex-shrink-0" />
              {errorImagenes}
            </p>
          )}
        </div>
      )}

      {/* Nombre + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => updateField('nombre', e.target.value)}
            required
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="Teclado Mecánico 75%"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Slug (URL) *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.slug}
              onChange={(e) => { setAutoSlug(false); updateField('slug', e.target.value) }}
              required
              className="flex-1 bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              placeholder="teclado-mecanico-75"
            />
            {!autoSlug && (
              <button
                type="button"
                onClick={() => { setAutoSlug(true); updateField('slug', slugify(form.nombre)) }}
                className="font-mono text-xs text-primary px-2 hover:underline whitespace-nowrap"
              >
                Auto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categoría + Marca + SKU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Categoría *
          </label>
          <select
            value={form.categoriaId}
            onChange={(e) => updateField('categoriaId', e.target.value)}
            required
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
          >
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Marca
          </label>
          <select
            value={form.marcaId}
            onChange={(e) => updateField('marcaId', e.target.value)}
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Sin marca</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          {marcas.length === 0 && (
            <p className="font-mono text-xs text-muted mt-1">
              Todavía no hay marcas.{' '}
              <Link href="/admin/marcas/nueva" className="text-primary hover:underline">
                Crear una
              </Link>
            </p>
          )}
        </div>
        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            SKU
          </label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => updateField('sku', e.target.value)}
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="TEC-MX-PRO-75"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
          Descripción
        </label>
        <textarea
          value={form.descripcion}
          onChange={(e) => updateField('descripcion', e.target.value)}
          rows={3}
          className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary resize-y"
          placeholder="Descripción del producto..."
        />
      </div>

      {/* Precio + Descuento + Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Precio (ARS) *
          </label>
          <input
            type="number"
            value={form.precio || ''}
            onChange={(e) => updateField('precio', parseInt(e.target.value) || 0)}
            required
            min={1}
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="75000"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Descuento (%)
          </label>
          <input
            type="number"
            value={form.descuento || ''}
            onChange={(e) => updateField('descuento', parseInt(e.target.value) || 0)}
            min={0}
            max={100}
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-muted uppercase tracking-wider mb-1">
            Stock base
          </label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="0"
          />
          {form.variantes.length > 0 && (
            <p className="flex items-center gap-1.5 font-mono text-xs text-muted mt-1">
              <AlertTriangle size={12} className="flex-shrink-0" />
              Con variantes, el stock se usa de las variantes
            </p>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => updateField('activo', e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <span className="font-mono text-sm">Activo (visible en tienda)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.destacado}
            onChange={(e) => updateField('destacado', e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <span className="font-mono text-sm">Destacado (aparece en home)</span>
        </label>
      </div>

      {/* Variantes */}
      <div className="border border-primary/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider">
            Variantes {form.variantes.length > 0 && `(${form.variantes.length})`}
          </h3>
          <button
            type="button"
            onClick={addVariante}
            className="font-mono text-xs text-primary hover:underline"
          >
            + Agregar variante
          </button>
        </div>

        {form.variantes.length === 0 ? (
          <p className="font-mono text-xs text-muted">
            Sin variantes. Se usa el precio y stock base del producto.
          </p>
        ) : (
          <div className="space-y-3">
            {form.variantes.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_80px_auto] gap-2 items-end">
                <div>
                  <label className="block font-mono text-xs text-muted mb-1">Nombre</label>
                  <input
                    type="text"
                    value={v.nombre}
                    onChange={(e) => updateVariante(i, 'nombre', e.target.value)}
                    required
                    className="w-full bg-background border border-primary/30 px-2 py-1.5 font-mono text-sm focus:outline-none focus:border-primary"
                    placeholder="Switch Rojo"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted mb-1">Precio</label>
                  <input
                    type="number"
                    value={v.precio ?? ''}
                    onChange={(e) => updateVariante(i, 'precio', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full bg-background border border-primary/30 px-2 py-1.5 font-mono text-sm focus:outline-none focus:border-primary"
                    placeholder="Base"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted mb-1">Stock</label>
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => updateVariante(i, 'stock', parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full bg-background border border-primary/30 px-2 py-1.5 font-mono text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariante(i)}
                  className="text-red-400 hover:text-red-600 pb-2"
                  title="Eliminar variante"
                  aria-label="Eliminar variante"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
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
              : createdId
                ? 'Reintentar subida'
                : 'Crear producto'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="font-mono text-sm text-muted hover:text-text px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
