import React from "react";
import { createRoot } from "react-dom/client";
import { hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * Client entry point - handles both SSR hydration and CSR mounting
 * 
 * If SSR content exists (from server), hydrate it.
 * Otherwise, do a normal client-side mount.
 */

// Read initial state from server (if SSR was used)
const initialState = typeof window !== 'undefined' && window.__INITIAL_STATE__ 
  ? window.__INITIAL_STATE__ 
  : {};

// Clean up the global variable after reading
if (typeof window !== 'undefined' && window.__INITIAL_STATE__) {
  delete window.__INITIAL_STATE__;
}

// Get the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Cannot mount React app.");
}

// Check if the root has SSR content (look for the SSR placeholder comment)
const hasSSRContent = rootElement.innerHTML.includes("<!--app-html-->") 
  ? false 
  : rootElement.innerHTML.trim().length > 20;

if (hasSSRContent) {
  // Hydrate existing SSR content
  console.log("[SSR] Hydrating server-rendered content...");
  hydrateRoot(rootElement, <App initialState={initialState} />);
} else {
  // No SSR content, do normal client-side render
  console.log("[CSR] Mounting React app...");
  createRoot(rootElement).render(<App initialState={initialState} />);
}
