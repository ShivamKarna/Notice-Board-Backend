import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "../utils/env";

// cloudinary config
cloudinary.config({
  cloud_name: getEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: getEnv("CLOUDINARY_API_KEY"),
  api_secret: getEnv("CLOUDINARY_API_SECRET"),
});

export async function cloudinaryDeleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
}

// get public_url from cloudinary
export function cloudinaryGetPublicIdFromUrl(url: string) {
  try {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    return null;
  }
}

export { cloudinary };
