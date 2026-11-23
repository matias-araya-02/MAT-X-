import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { BannerForm } from '@/components/admin/BannerForm'

export const metadata: Metadata = { title: 'Banner | Admin MAT-X' }

export default async function AdminBannerPage() {
  const banner = await prisma.bannerParallax.findUnique({ where: { id: 1 } })

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase mb-2">Banner parallax</h1>
      <p className="font-mono text-sm text-muted mb-8">
        Imagen con efecto parallax que aparece entre Categorías y Marcas.
      </p>
      <BannerForm banner={banner} />
    </div>
  )
}
