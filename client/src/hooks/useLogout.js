import { useNavigate } from "react-router-dom";

/**
 * Shared logout handler — clears the auth token and redirects to /login.
 * Previously this exact 3-line function was copy-pasted into every page
 * component just to hand it to <TopBar onLogout={...} />. Now that TopBar
 * is mounted once in Layout.jsx, this lives in one place instead.
 *
 * Note: Sidebar.jsx has its own internal handleLogout (used by its footer
 * logout button) — that's left untouched per the "don't touch Sidebar/TopBar
 * internals" constraint, so it doesn't consume this hook. This hook only
 * covers the logout wiring that used to be duplicated at the page level.
 */
export function useLogout() {
  const navigate = useNavigate();
  return () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
}