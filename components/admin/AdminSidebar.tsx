'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  Gamepad2,
  FolderTree,
  Tag,
  PanelTop,
  Star,
  Sparkles,
  Clock,
  Settings,
  LogOut,
} from 'lucide-react'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: Package, exact: false },
  { href: '/admin/productos', label: 'Productos', icon: Gamepad2, exact: false },
  { href: '/admin/categorias', label: 'Categorías', icon: FolderTree, exact: false },
  { href: '/admin/marcas', label: 'Marcas', icon: Tag, exact: false },
  { href: '/admin/hero', label: 'Hero', icon: PanelTop, exact: false },
  { href: '/admin/destacados', label: 'Destacados', icon: Star, exact: false },
  { href: '/admin/banner', label: 'Banner', icon: Sparkles, exact: false },
  { href: '/admin/proximamente', label: 'Próximamente', icon: Clock, exact: false },
  { href: '/admin/config', label: 'Configuración', icon: Settings, exact: false },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="w-56 min-h-screen bg-surface border-r border-primary/20 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-primary/20 flex items-center gap-3">
        <Image src="/logo.svg" alt="MAT-X" width={36} height={36} />
        <div>
          <p className="font-heading font-bold text-sm uppercase tracking-wider">MAT-X</p>
          <p className="font-mono text-xs text-muted">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href, link.exact)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-text hover:bg-background'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-primary/20">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-mono text-sm text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
