/**
 * Clean up blob URL to prevent memory leaks
 * @param {string} url - Blob URL to revoke
 */
export const cleanupBlobUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Create a new blob URL from blob
 * @param {Blob} blob - Blob to create URL for
 * @returns {string} - New blob URL
 */
export const createBlobUrl = (blob) => {
  return URL.createObjectURL(blob);
}; 