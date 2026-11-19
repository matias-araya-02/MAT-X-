import Link from 'next/link'
import Image from 'next/image'
import { Truck } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

export function Footer() {
  return (
    <footer className="bg-surface border-t border-primary/20 mt-24">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-[auto_auto_auto] md:justify-center gap-8 md:gap-x-48">
          {/* Marca */}
          <div>
            <Link href="/" aria-label="MAT-X, ir al inicio" className="inline-block mb-3">
              <Image
                src="/logo.svg"
                alt="MAT-X"
                width={72}
                height={72}
                unoptimized
              />
            </Link>
            <p className="font-mono text-sm text-muted">
              Periféricos gaming de alto rendimiento.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading font-bold uppercase tracking-wider mb-4">Catálogo</h3>
            <ul className="space-y-2 font-mono text-sm text-muted">
              <li><Link href="/productos?categoria=teclados" className="hover:text-primary transition-colors">Teclados</Link></li>
              <li><Link href="/productos?categoria=auriculares" className="hover:text-primary transition-colors">Auriculares</Link></li>
              <li><Link href="/productos?categoria=cables" className="hover:text-primary transition-colors">Cables Coiled</Link></li>
              <li><Link href="/productos?categoria=controladoras" className="hover:text-primary transition-colors">Controladoras</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-heading font-bold uppercase tracking-wider mb-4">Contacto</h3>
            <div className="space-y-2 font-mono text-sm text-muted">
              <p className="flex items-center gap-2">
                <Truck size={16} strokeWidth={2} className="text-primary flex-shrink-0" />
                Envíos a todo el país.
              </p>
              <p className="flex items-center gap-2">
                <WhatsAppIcon size={16} className="text-primary flex-shrink-0" />
                Se coordina por WhatsApp.
              </p>
            </div>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 btn-primary text-sm"
            >
              <WhatsAppIcon size={16} />
              Escribinos por WhatsApp
            </a>
          </div>
        </div>

        <div className="dotted-line mt-8 pt-8">
          <p className="font-mono text-xs text-muted text-center">
            © {new Date().getFullYear()} MAT-X. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
