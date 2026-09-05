import { useEffect, useState } from "react";

export default function LogoutConfirmModal({ onConfirm, onCancel }) {
  const [signingOut, setSigningOut] = useState(false);

  // Close on Escape key (only when not signing out)
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && !signingOut) onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel, signingOut]);

  const handleConfirm = () => {
    setSigningOut(true);
    setTimeout(() => onConfirm(), 1600);
  };

  return (
    <div
      onClick={(e) => !signingOut && e.target === e.currentTarget && onCancel()}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(15,10,30,0.55)", backdropFilter: "blur(4px)",
        fontFamily: "'DM Sans',sans-serif",
        animation: "lco-overlay 0.18s ease both",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20,
        padding: signingOut ? "40px 32px" : "36px 32px 28px",
        width: "min(380px,92vw)", boxShadow: "0 28px 70px rgba(76,29,149,0.22)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
        animation: "lco-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        textAlign: "center", transition: "padding 0.3s ease",
      }}>

        {signingOut ? (
          /* ── Signing out state ── */
          <>
            {/* Spinning ring */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%", marginBottom: 18,
              border: "3px solid #ede9fe", borderTopColor: "#7c3aed",
              animation: "lco-spin 0.75s linear infinite",
            }} />
            <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#27213a", letterSpacing: "-0.03em" }}>
              Signing you out…
            </p>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "#9080a0", lineHeight: 1.5 }}>
              Clearing your session and returning to login.
            </p>
            {/* Progress bar */}
            <div style={{ width: "100%", height: 4, borderRadius: 99, background: "#ede9fe", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                background: "linear-gradient(90deg,#a78bfa,#7c3aed)",
                animation: "lco-progress 1.6s linear forwards",
              }} />
            </div>
          </>
        ) : (
          /* ── Confirm state ── */
          <>
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 16, marginBottom: 18,
              background: "linear-gradient(135deg,#2d0a5e,#6b21a8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 22px rgba(107,33,168,0.3)",
              animation: "lco-icon 0.35s cubic-bezier(0.34,1.56,0.64,1) 0.05s both",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#27213a", letterSpacing: "-0.03em" }}>
              Sign out of PATH?
            </p>
            <p style={{ margin: "0 0 26px", fontSize: 13, color: "#9080a0", lineHeight: 1.55 }}>
              You'll be returned to the login screen. Any unsaved work will remain intact.
            </p>

            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10,
                  border: "1px solid #e8e1f5", background: "#faf8ff",
                  color: "#6b5f76", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0e9fc"}
                onMouseLeave={e => e.currentTarget.style.background = "#faf8ff"}
              >
                Stay signed in
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#2d0a5e,#7c3aed)",
                  color: "#fff", fontSize: 13, fontWeight: 800,
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                Yes, sign out
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes lco-overlay  { from{opacity:0} to{opacity:1} }
        @keyframes lco-pop      { from{opacity:0;transform:scale(0.88) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes lco-icon     { from{transform:scale(0) rotate(-20deg);opacity:0} to{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes lco-spin     { to{transform:rotate(360deg)} }
        @keyframes lco-progress { from{width:0%} to{width:100%} }
      `}</style>
    </div>
  );
}
