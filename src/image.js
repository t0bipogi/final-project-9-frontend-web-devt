// Returns an error message, or "" if the file is a usable image.
export function checkImageFile(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return "Choose a JPEG, PNG, or WebP image.";
  if (file.size > 10 * 1024 * 1024) return "That image is too large. Choose one under 10 MB.";
  return "";
}
