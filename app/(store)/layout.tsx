import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { LogoLoader } from '@/components/layout/LogoLoader'
import { FavoritosSync } from '@/components/layout/FavoritosSync'

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <FavoritosSync />
      <LogoLoader />
      <SmoothScroll />
      <AnnouncementBar />
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  )
}
