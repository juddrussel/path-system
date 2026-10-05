import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Import public pages only
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import HelpDesk from "./pages/HelpDesk";
import NotFound from "./pages/NotFound";

// Import global styles
import "./index.css";
import "./styles/ux-improvements.css";

/**
 * Server-side rendering entry point
 * 
 * @param {string} url - The URL path to render (e.g., "/login")
 * @param {object} initialState - Pre-fetched data to pass to components (e.g., { tokenValid: true })
 * @returns {{ html: string, initialState: object }} - Rendered HTML and initial state
 */
export function render(url, initialState = {}) {
  // Map of SSR-enabled routes (public pages only)
  const PUBLIC_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/privacy-policy",
    "/terms-of-use",
    "/help-desk",
  ];

  // Check if route is SSR-enabled
  const isPublicRoute = PUBLIC_ROUTES.includes(url) || url === "/";

  if (!isPublicRoute) {
    throw new Error(`SSR not enabled for route: ${url}. Only public routes are supported.`);
  }

  // Create a context provider for initial state if needed
  const StateContext = React.createContext(initialState);

  // Wrap components to accept initial state
  const ResetPasswordWithState = (props) => (
    <StateContext.Consumer>
      {(state) => <ResetPassword {...props} initialState={state} />}
    </StateContext.Consumer>
  );

  // Use MemoryRouter for SSR with initial entries
  // MemoryRouter provides router context needed by useNavigate() hooks
  const html = renderToString(
    <StateContext.Provider value={initialState}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPasswordWithState />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/help-desk" element={<HelpDesk />} />
          <Route path="/" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    </StateContext.Provider>
  );

  return { html, initialState };
}
