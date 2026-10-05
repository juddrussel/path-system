import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * Client-side hydration entry point
 * 
 * This file is used when SSR is enabled. It hydrates the server-rendered
 * HTML instead of mounting from scratch, preserving the initial content
 * and making it interactive.
 */

// Read initial state from server (if SSR was used)
const initialState = window.__INITIAL_STATE__ || {};

// Clean up the global variable after reading
delete window.__INITIAL_STATE__;

// Get the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. SSR hydration failed.");
}

// Check if the root has SSR content (non-empty)
const hasSSRContent = rootElement.innerHTML.trim().length > 0;

if (hasSSRContent) {
  // Hydrate existing SSR content
  console.log("[SSR] Hydrating server-rendered content...");
  
  try {
    hydrateRoot(rootElement, <App initialState={initialState} />);
    console.log("[SSR] Hydration successful!");
  } catch (error) {
    console.error("[SSR] Hydration failed:", error);
    // Fallback: force client-side render
    console.warn("[SSR] Falling back to client-side render...");
    rootElement.innerHTML = "";
    const { createRoot } = await import("react-dom/client");
    createRoot(rootElement).render(<App initialState={initialState} />);
  }
} else {
  // No SSR content, do normal client-side render
  console.log("[CSR] No SSR content detected, mounting React app...");
  const { createRoot } = await import("react-dom/client");
  createRoot(rootElement).render(<App initialState={initialState} />);
}
