import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración | Admin MAT-X',
}

export default function AdminConfigPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Configuración</h1>
      {/* TODO: Formulario para descuento por transferencia */}
      {/* TODO: Formulario para número de WhatsApp */}
    </div>
  )
}
