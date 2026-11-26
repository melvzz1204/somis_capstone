const { createCanvas, loadImage } = require("@napi-rs/canvas");

// Avatars are stored inline on the roster document (a data URI) so the app does
// not depend on Render's ephemeral disk. Because the whole roster (including
// avatars) is returned in a single JSON payload, an unprocessed 1 MB+ photo
// makes list loading extremely slow. Downscale every upload to a small
// thumbnail before storing it.
const AVATAR_MAX_DIMENSION = 256;
const AVATAR_QUALITY = 80;

const toDataUri = (mime, buffer) =>
  `data:${mime};base64,${buffer.toString("base64")}`;

/**
 * Resize an uploaded avatar to a compact thumbnail and return it as a data URI.
 * Falls back to the original bytes whenever the image cannot be processed, so a
 * failed resize never blocks an upload.
 *
 * @param {{ buffer?: Buffer, mimetype?: string } | undefined} file
 * @returns {Promise<string | null>}
 */
const processAvatar = async (file) => {
  if (!file?.buffer || !file.mimetype || !file.mimetype.startsWith("image/")) {
    return null;
  }

  try {
    const image = await loadImage(file.buffer);
    const longestSide = Math.max(image.width, image.height) || 1;
    const scale = Math.min(1, AVATAR_MAX_DIMENSION / longestSide);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);

    let mime = "image/webp";
    let buffer;
    try {
      buffer = canvas.toBuffer("image/webp", AVATAR_QUALITY);
    } catch {
      mime = "image/jpeg";
      buffer = canvas.toBuffer("image/jpeg", AVATAR_QUALITY);
    }

    // Keep the processed thumbnail only when it actually shrinks the payload;
    // very small originals can be re-encoded slightly larger.
    if (buffer && buffer.length < file.buffer.length) {
      return toDataUri(mime, buffer);
    }
  } catch (_error) {
    // Ignore and fall back to the original bytes below.
  }

  return toDataUri(file.mimetype, file.buffer);
};

module.exports = { processAvatar, AVATAR_MAX_DIMENSION };
