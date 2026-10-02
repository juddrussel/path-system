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

/**
 * Download a file with authentication
 * Fetches the file with the auth token and triggers a download
 * @param {string} url - The proxy URL to download from
 * @param {string} filename - The filename to save as
 */
export const downloadFileWithAuth = async (url, filename) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      alert('Please log in to download files');
      return;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }
      throw new Error(`Download failed: ${response.status}`);
    }

    // Get the file blob
    const blob = await response.blob();
    
    // Create a download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download file. Please try again.');
  }
};

/**
 * Open a file in a new tab with authentication
 * Fetches the file with auth token and opens it in a new window
 * @param {string} url - The proxy URL to open
 */
export const openFileWithAuth = async (url) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      alert('Please log in to view files');
      return;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }
      throw new Error(`Failed to load file: ${response.status}`);
    }

    // Get the file blob
    const blob = await response.blob();
    
    // Create an object URL and open it
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    
    // Note: We don't immediately revoke the URL as the new window needs it
    // The browser will clean it up when the window is closed
  } catch (error) {
    console.error('Open file error:', error);
    alert('Failed to open file. Please try again.');
  }
};
