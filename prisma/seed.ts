import * as dotenv from 'dotenv'
dotenv.config()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpiar tablas (en orden por FK)
  await prisma.imagen.deleteMany()
  await prisma.variante.deleteMany()
  await prisma.producto.deleteMany()
  await prisma.categoria.deleteMany()
  await prisma.config.deleteMany()

  // Config global
  await prisma.config.create({
    data: { id: 1, descuentoTransferencia: 10 },
  })

  // Categorías
  const categorias = await Promise.all([
    prisma.categoria.create({ data: { nombre: 'Teclados', slug: 'teclados', orden: 1 } }),
    prisma.categoria.create({ data: { nombre: 'Auriculares', slug: 'auriculares', orden: 2 } }),
    prisma.categoria.create({ data: { nombre: 'Cables', slug: 'cables', orden: 3 } }),
    prisma.categoria.create({ data: { nombre: 'Controladoras', slug: 'controladoras', orden: 4 } }),
  ])

  const [teclados, auriculares, cables, controladoras] = categorias

  // Productos de prueba
  await prisma.producto.create({
    data: {
      nombre: 'Teclado MAT-X Pro 75%',
      slug: 'teclado-mat-x-pro-75',
      sku: 'TKL-MX-001',
      descripcion: 'Teclado mecánico 75% con switches ópticos y RGB por zona. Layout compacto ideal para gaming.',
      precio: 85000,
      descuento: 15,
      stock: 0,
      activo: true,
      destacado: true,
      categoriaId: teclados.id,
      variantes: {
        create: [
          { nombre: 'Negro / Switch Rojo', stock: 10 },
          { nombre: 'Blanco / Switch Azul', stock: 5 },
          { nombre: 'Violeta / Switch Silencioso', stock: 3 },
        ],
      },
    },
  })

  await prisma.producto.create({
    data: {
      nombre: 'Auriculares MAT-X Void 7.1',
      slug: 'auriculares-mat-x-void-71',
      sku: 'AUR-MX-001',
      descripcion: 'Auriculares gaming con sonido virtual 7.1, micrófono retráctil y diadema acolchada.',
      precio: 62000,
      descuento: null,
      stock: 15,
      activo: true,
      destacado: true,
      categoriaId: auriculares.id,
    },
  })

  await prisma.producto.create({
    data: {
      nombre: 'Cable Coiled MAT-X',
      slug: 'cable-coiled-mat-x',
      sku: 'CAB-MX-001',
      descripcion: 'Cable USB-C a USB-A enrulado, terminaciones de aluminio, longitud 1.8m extendido.',
      precio: 18000,
      descuento: null,
      stock: 0,
      activo: true,
      destacado: false,
      categoriaId: cables.id,
      variantes: {
        create: [
          { nombre: 'Violeta / 1.8m', stock: 20 },
          { nombre: 'Negro / 1.8m', stock: 12 },
          { nombre: 'Blanco / 1.5m', stock: 8 },
        ],
      },
    },
  })

  await prisma.producto.create({
    data: {
      nombre: 'Controladora MAT-X PCPad Pro',
      slug: 'controladora-mat-x-pcpad-pro',
      sku: 'CTR-MX-001',
      descripcion: 'Controladora para PC con layout Xbox, vibración dual y cable trenzado de 2m.',
      precio: 48000,
      descuento: 10,
      stock: 7,
      activo: true,
      destacado: true,
      categoriaId: controladoras.id,
    },
  })

  console.log('✅ Seed completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
