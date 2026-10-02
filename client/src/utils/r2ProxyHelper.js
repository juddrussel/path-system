/**
 * R2 Proxy Helper
 * Converts R2 URLs to proxy URLs with secure authentication
 * NOTE: Tokens are NEVER included in URLs to prevent sharing
 */

/**
 * Get JWT token from localStorage
 * @returns {string|null} - JWT token or null
 */
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Fetch file with authentication and create a blob URL for iframe use
 * @param {string} apiUrl - Base API URL
 * @param {string} key - R2 object key
 * @returns {Promise<string>} - Blob URL that can be used in iframe src
 */
export async function createAuthenticatedBlobUrl(apiUrl, key) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  try {
    const response = await fetch(`${apiUrl}/api/files/proxy?key=${encodeURIComponent(key)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to create blob URL:', err);
    throw err;
  }
}

/**
 * Convert R2 URLs to proxy URLs (without token in URL for security)
 * @param {string} apiUrl - Base API URL
 * @param {string} value - The file URL or path to resolve
 * @returns {string} - Resolved proxy URL (token must be sent in Authorization header)
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
        // Return proxy URL WITHOUT token (token sent in header instead)
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
 * Convert R2 URL to proxy URL (without token in URL)
 * @param {string} apiUrl - Base API URL
 * @param {string} url - R2 URL
 * @returns {string} - Proxy URL (token must be sent in Authorization header)
 */
export const r2ToProxyUrl = (apiUrl, url) => {
  const key = extractR2Key(url);
  
  if (key) {
    // Return proxy URL WITHOUT token (token sent in header instead)
    return `${apiUrl}/api/files/proxy?key=${encodeURIComponent(key)}`;
  }
  return url;
};
