/**
 * R2 Proxy Helper
 * Converts R2 URLs to proxy URLs to bypass rate limits
 */

/**
 * Convert R2 URLs to proxy URLs, handles relative paths, and returns empty string for null/undefined
 * @param {string} apiUrl - Base API URL (e.g., "https://myapp.com" or "http://localhost:5000")
 * @param {string} value - The file URL or path to resolve
 * @returns {string} - Resolved URL (proxy, absolute, or relative)
 */
export const resolveFileUrl = (apiUrl, value) => {
  if (!value) return "";
  
  // If it's already a full URL
  if (/^https?:\/\//i.test(value)) {
    // If it's an R2 URL, convert to proxy URL
    if (value.includes("r2.dev")) {
      // Extract the key from the R2 URL
      // URL format: https://pub-xxx.r2.dev/uploads/uuid-filename
      const match = value.match(/r2\.dev\/(.+)$/);
      if (match) {
        const key = match[1];
        return `${apiUrl}/api/files/proxy?key=${encodeURIComponent(key)}`;
      }
    }
    return value;
  }
  
  // Relative path - prepend API URL
  return `${apiUrl}${value}`;
};

/**
 * Extract R2 key from a full R2 URL
 * @param {string} url - Full R2 URL
 * @returns {string|null} - R2 key or null if not an R2 URL
 */
export const extractR2Key = (url) => {
  if (!url || !url.includes("r2.dev")) return null;
  const match = url.match(/r2\.dev\/(.+)$/);
  return match ? match[1] : null;
};

/**
 * Convert R2 URL to proxy URL
 * @param {string} apiUrl - Base API URL
 * @param {string} url - R2 URL
 * @returns {string} - Proxy URL
 */
export const r2ToProxyUrl = (apiUrl, url) => {
  const key = extractR2Key(url);
  if (key) {
    return `${apiUrl}/api/files/proxy?key=${encodeURIComponent(key)}`;
  }
  return url;
};
