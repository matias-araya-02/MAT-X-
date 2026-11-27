import type { Metadata } from 'next'
import { FavoritosView } from '@/components/product/FavoritosView'

export const metadata: Metadata = {
  title: 'Favoritos',
  description: 'Tus productos guardados.',
  robots: { index: false }, // es una lista personal, no tiene sentido indexarla
}

export default function FavoritosPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12">
      <h1 className="mb-8 font-heading text-3xl font-bold uppercase md:text-4xl">
        Favoritos
      </h1>
      <FavoritosView />
    </div>
  )
}
