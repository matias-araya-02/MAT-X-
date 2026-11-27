-- CreateTable
CREATE TABLE "ProximamenteConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "titulo" TEXT,
    "subtitulo" TEXT,
    "videoUrl" TEXT,
    "imagenUrl" TEXT,
    "imagenPublicId" TEXT,
    "enlaceTexto" TEXT,
    "enlaceUrl" TEXT,

    CONSTRAINT "ProximamenteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProximoIngreso" (
    "id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "nombre" TEXT NOT NULL,
    "marcaId" TEXT,
    "llegada" TEXT,
    "precioEstimado" INTEGER,
    "imagenUrl" TEXT NOT NULL,
    "imagenPublicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProximoIngreso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProximoIngreso_marcaId_idx" ON "ProximoIngreso"("marcaId");

-- CreateIndex
CREATE INDEX "ProximoIngreso_orden_idx" ON "ProximoIngreso"("orden");

-- AddForeignKey
ALTER TABLE "ProximoIngreso" ADD CONSTRAINT "ProximoIngreso_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
