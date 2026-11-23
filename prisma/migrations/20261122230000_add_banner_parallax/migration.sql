-- CreateTable
CREATE TABLE "BannerParallax" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "imagenUrl" TEXT,
    "imagenPublicId" TEXT,
    "overlay" INTEGER NOT NULL DEFAULT 40,
    "titulo" TEXT,
    "subtitulo" TEXT,
    "botonTexto" TEXT,
    "botonUrl" TEXT,

    CONSTRAINT "BannerParallax_pkey" PRIMARY KEY ("id")
);
