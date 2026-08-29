import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useLogout } from "../hooks/useLogout";

/**
 * Shared authenticated-app shell. Mounted once at the router level (see
 * App.jsx) so Sidebar and TopBar persist across navigation instead of
 * unmounting/remounting on every page change — this is what stops the
 * profile-section flicker and repeated font-loading that happened when
 * every page rendered its own <Sidebar>/<TopBar>.
 *
 * Layout structure matches what every page used to render inline:
 * an outer flex row with Sidebar and the main content area as siblings,
 * and inside the main content area, TopBar and the routed page body as
 * siblings in a flex column.
 *
 * TopBar's `children` prop renders into its own internal top-bar slot
 * (a title/breadcrumb area), NOT the page body — so the routed page
 * content (<Outlet />) is a sibling of TopBar, not nested inside it.
 *
 * Sidebar auto-detects the active nav item from the URL via useLocation,
 * so no activePage prop is passed here. A couple of routes that don't
 * live directly under a nav item's path (e.g. /task-details/:id,
 * /document-review/:id, and possibly /workflow-designer or
 * /workflow-dashboard) may have previously passed an explicit activePage
 * override at the page level to force-highlight a related nav item —
 * see the note at the end of my response about this.
 */
export default function Layout() {
  const handleLogout = useLogout();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "white",
        }}
      >
        <TopBar onLogout={handleLogout} />
        <Outlet />
      </div>
    </div>
  );
}