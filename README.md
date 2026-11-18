# MAT-X — E-commerce de Periféricos Gaming

> **Stack:** Next.js 15 · TypeScript · Tailwind CSS · Prisma 6 · Neon · NextAuth v4 · Zustand · Cloudinary · Upstash

## 🚀 Setup inicial

### 1. Instalar dependencias

```bash
pnpm install
# o
npm install
```

### 2. Variables de entorno

Copiar `.env.local` y completar los valores:

```bash
cp .env.local .env.local
```

Variables necesarias:
- `DATABASE_URL` — Neon con pooler
- `DIRECT_URL` — Neon sin pooler (para Prisma Migrate)
- `NEXTAUTH_SECRET` — generar con `openssl rand -base64 32`
- `ADMIN_EMAIL` y `ADMIN_PASSWORD_HASH` — hash bcrypt del password
- `CLOUDINARY_*` — credenciales de Cloudinary
- `UPSTASH_*` — credenciales de Upstash Redis
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — número con código de país (ej: `549261XXXXXXX`)

### 3. Base de datos

```bash
# Generar el cliente Prisma
npm run db:generate

# Correr la migración inicial
npm run db:migrate

# Cargar datos de prueba
npm run db:seed
```

### 4. Generar hash del password admin

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TU_PASSWORD', 12).then(h => console.log(h))"
```

### 5. Desarrollo

```bash
npm run dev
```

## 📁 Estructura

```
app/
  (store)/          ← Tienda pública
    page.tsx         ← Home
    productos/       ← Catálogo y detalle
    pedido/[codigo]  ← Resumen de pedido
  admin/             ← Panel admin (protegido)
  api/               ← API routes

components/
  layout/            ← Navbar, Footer, AnnouncementBar
  product/           ← ProductCard, ProductGrid, Gallery
  cart/              ← CartDrawer, CartItem
  ui/                ← Button, Badge, Input
  admin/             ← Formularios admin

lib/                 ← Prisma, Cloudinary, WhatsApp, Zod, pricing
store/               ← Zustand (carrito)
types/               ← Tipos globales TS
prisma/              ← schema.prisma + seed.ts
```

## 🗺️ Fases

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1 | 🔧 En progreso | Estructura base, UI, layout |
| 2 | ⏳ Pendiente | Catálogo, Prisma, seed |
| 3 | ⏳ Pendiente | Carrito, pedidos por WhatsApp |
| 4 | ⏳ Pendiente | Panel admin |
| 5 | ⏳ Pendiente | Deploy y optimización |

## 🎨 Paleta

| Token | Color |
|-------|-------|
| `primary` | `#7C3AED` Violeta |
| `secondary` | `#A78BFA` Violeta claro |
| `accent` | `#DDD6FE` Lavanda |
| `background` | `#0A0A0A` Negro profundo |
| `surface` | `#111111` Negro suave |
| `text` | `#FFFFFF` Blanco |
| `muted` | `#6B7280` Gris |
