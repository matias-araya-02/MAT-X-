import type { Metadata } from 'next'
import { MarcaForm } from '@/components/admin/MarcaForm'

export const metadata: Metadata = { title: 'Nueva Marca | Admin MAT-X' }

export default function NuevaMarcaPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-6">Nueva Marca</h1>
      <MarcaForm />
    </div>
  )
}
