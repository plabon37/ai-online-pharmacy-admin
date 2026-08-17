import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    "Cloudinary environment variables are not properly configured"
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

/**
 * Extract Cloudinary public_id from a secure URL.
 *
 * Example:
 * https://res.cloudinary.com/demo/image/upload/v123/
 * smart-pharmacy/categories/abc123.jpg
 *
 * returns:
 * smart-pharmacy/categories/abc123
 */
export function getCloudinaryPublicId(
  imageUrl: string
): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);

    if (!url.hostname.includes("res.cloudinary.com")) {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);

    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    let publicIdParts = parts.slice(uploadIndex + 1);

    if (!publicIdParts.length) {
      return null;
    }

    /*
     * Remove version segment:
     * v123456789
     */
    if (/^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }

    if (!publicIdParts.length) {
      return null;
    }

    const lastIndex = publicIdParts.length - 1;

    publicIdParts[lastIndex] =
      publicIdParts[lastIndex].replace(
        /\.[^/.]+$/,
        ""
      );

    return publicIdParts.join("/");
  } catch {
    return null;
  }
}

export async function deleteCloudinaryImage(
  imageUrl: string
): Promise<boolean> {
  const publicId =
    getCloudinaryPublicId(imageUrl);

  if (!publicId) {
    return false;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
        invalidate: true,
      }
    );

    return true;
  } catch (error) {
    console.error(
      "Cloudinary delete error:",
      error
    );

    return false;
  }
}

export default cloudinary;