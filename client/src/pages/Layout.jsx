import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import LogoutConfirmModal from "../components/LogoutConfirmModal";

export default function Layout() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const requestLogout = () => setShowLogout(true);
  const confirmLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar onLogout={requestLogout} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "white",
        }}
      >
        <TopBar onLogout={requestLogout} />
        <Outlet />
      </div>

      {showLogout && (
        <LogoutConfirmModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}