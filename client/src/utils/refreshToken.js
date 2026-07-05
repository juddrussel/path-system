// src/utils/refreshToken.js
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function refreshToken() {
  const token = localStorage.getItem("token");

  // No token — user is not logged in, do nothing
  if (!token) return;

  // Don't run on public pages
  const publicPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  if (publicPaths.includes(window.location.pathname)) return;

  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
    }
    // If not ok — do NOT redirect. Just silently keep the existing token.
    // The individual pages handle their own auth checks.
  } catch {
    // Network error — do nothing, keep existing token
  }
}