import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

/**
 * Elimina una imagen de Cloudinary por su publicId.
 * Se usa cuando se borra un producto o se reemplaza una imagen.
 */
export async function eliminarImagen(publicId: string) {
  return cloudinary.uploader.destroy(publicId)
}
