import Link from 'next/link'

export function Hero() {
    return (
        <section className="relative overflow-hidden">
            {/* Degradado violeta de fondo */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.12),transparent_60%)]"
            />

            <div className="container relative mx-auto px-4 py-20 md:py-32">
                <p className="card-label mb-6 inline-block">Nuevos ingresos</p>

                <h1 className="font-heading text-5xl font-bold uppercase leading-none md:text-8xl">
                    Subí el nivel
                    <br />
                    <span className="text-primary">de tu setup</span>
                </h1>

                <p className="mt-6 max-w-xl font-mono text-sm text-muted md:text-base">
                    Teclados, auriculares, cables y controladoras para gamers.
                    Pedí por WhatsApp y coordinamos el envío a todo el país.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                    <Link href="/productos" className="btn-primary">
                        Ver productos
                    </Link>
                    <Link href="/productos?categoria=teclados" className="btn-outline">
                        Teclados
                    </Link>
                </div>
            </div>
        </section>
    )
}