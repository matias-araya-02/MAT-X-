'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

interface ProductoData {
  id?: string
  nombre: string
  slug: string
  marca: string
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

interface Props {
  categorias: Categoria[]
  producto?: ProductoData
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ProductoForm({ categorias, producto }: Props) {
  const router = useRouter()
  const isEditing = !!producto?.id

  const [form, setForm] = useState<ProductoData>({
    nombre: producto?.nombre ?? '',
    slug: producto?.slug ?? '',
    marca: producto?.marca ?? '',
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEditing
        ? `/api/admin/productos/${producto!.id}`
        : '/api/admin/productos'
      const method = isEditing ? 'PATCH' : 'POST'

      const payload = {
        ...form,
        marca: form.marca || null,
        sku: form.sku || null,
        descripcion: form.descripcion || null,
        descuento: form.descuento || null,
        variantes: form.variantes.length > 0 ? form.variantes : [],
      }

      const res = await fetch(url, {
        method,
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
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 font-mono text-sm text-red-600">
          ⚠️ {error}
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

      {/* Categoría + SKU + Marca */}
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
          <input
            type="text"
            value={form.marca}
            onChange={(e) => updateField('marca', e.target.value)}
            className="w-full bg-background border border-primary/30 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            placeholder="Attack Shark, Redragon..."
          />
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
            <p className="font-mono text-xs text-muted mt-1">⚠️ Con variantes, el stock se usa de las variantes</p>
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
                  className="text-red-400 hover:text-red-600 font-mono text-sm pb-1.5"
                  title="Eliminar variante"
                >
                  ✕
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
          {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
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
