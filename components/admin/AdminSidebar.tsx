'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '📦', exact: false },
  { href: '/admin/productos', label: 'Productos', icon: '🎮', exact: false },
  { href: '/admin/config', label: 'Configuración', icon: '⚙️', exact: false },
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
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 font-mono text-sm transition-colors ${
              isActive(link.href, link.exact)
                ? 'bg-primary text-white'
                : 'text-muted hover:text-text hover:bg-background'
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-primary/20">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2 w-full font-mono text-sm text-muted hover:text-red-500 transition-colors"
        >
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
