/**
 * Image storage utilities for draft management
 * Stores image metadata instead of base64 to save space
 */

export type ImageMetadata = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  dataUrl?: string; // Optional: only loaded when needed
};

/**
 * Extract metadata from a File object
 */
export const getImageMetadata = (file: File): ImageMetadata => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
};

/**
 * Convert File to data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Check if an image file matches the stored metadata
 * (same name, size, and type indicates it's likely the same file)
 */
export const isImageMatch = (file: File, metadata: ImageMetadata): boolean => {
  return (
    file.name === metadata.name &&
    file.size === metadata.size &&
    file.type === metadata.type
  );
};

/**
 * Find matching images from FileList for stored metadata
 */
export const findMatchingImages = (
  files: FileList,
  metadataList: ImageMetadata[]
): { matched: (File | null)[]; unmatched: ImageMetadata[] } => {
  const matched: (File | null)[] = [];
  const unmatched: ImageMetadata[] = [];

  for (const metadata of metadataList) {
    let found = false;
    for (let i = 0; i < files.length; i++) {
      if (isImageMatch(files[i], metadata)) {
        matched.push(files[i]);
        found = true;
        break;
      }
    }
    if (!found) {
      unmatched.push(metadata);
    }
  }

  return { matched, unmatched };
};
