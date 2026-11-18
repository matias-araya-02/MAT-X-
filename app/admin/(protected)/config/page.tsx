import type { Metadata } from 'next'
import ConfigForm from '@/components/admin/ConfigForm'

export const metadata: Metadata = {
  title: 'Configuración | Admin MAT-X',
}

export default function AdminConfigPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">CONFIGURACIÓN</h1>
      <ConfigForm />
    </div>
  )
}
