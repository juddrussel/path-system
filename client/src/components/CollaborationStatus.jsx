import React, { useState, useEffect } from "react";

/**
 * CollaborationStatus
 * Shows who has confirmed their edits and when.
 * Green checkmark = confirmed, Yellow hourglass = pending <24h, Red alert = overdue >24h
 */
export default function CollaborationStatus({ taskId, token, apiUrl }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCollaborators = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/tasks/${taskId}/collaborators`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load collaborators");
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      } catch (err) {
        setError(err.message);
        console.error("CollaborationStatus error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId && token) loadCollaborators();
  }, [taskId, token, apiUrl]);

  if (loading) return <div className="coll-status-loading">Loading collaborators...</div>;
  if (error) return <div className="coll-status-error">Error: {error}</div>;
  if (collaborators.length === 0) return null;

  return (
    <div className="coll-status">
      <div className="coll-status-header">
        <span>Collaboration Status</span>
        <em>{collaborators.filter(c => c.confirmedAt).length} of {collaborators.length} confirmed</em>
      </div>
      <div className="coll-status-list">
        {collaborators.map((collab) => {
          const confirmedAt = collab.confirmedAt ? new Date(collab.confirmedAt) : null;
          const now = new Date();
          const hoursAgo = confirmedAt ? (now - confirmedAt) / (1000 * 60 * 60) : null;
          
          let statusClass = "pending";
          let icon = "⏳";
          let label = "Pending";

          if (confirmedAt) {
            statusClass = "confirmed";
            icon = "✓";
            label = `Confirmed ${hoursAgo < 1 ? "just now" : hoursAgo < 24 ? `${Math.floor(hoursAgo)}h ago` : `${Math.floor(hoursAgo / 24)}d ago`}`;
          } else if (hoursAgo !== null && hoursAgo > 24) {
            statusClass = "overdue";
            icon = "⚠";
            label = `Overdue ${Math.floor(hoursAgo - 24)}h`;
          }

          // Generate initials for avatar
          const initials = (collab.fullName || "?")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("");

          const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];
          const colorIndex = collab.userId % colors.length;
          const bgColor = colors[colorIndex];

          return (
            <div key={collab.userId} className={`coll-status-badge coll-status-${statusClass}`}>
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: bgColor,
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {initials}
                </div>
                {confirmedAt && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      background: "#10b981",
                      color: "#fff",
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                      border: "2px solid #fff",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block", marginBottom: "1px", fontSize: "13px", color: "#3a2a45" }}>{collab.fullName}</strong>
                <small style={{ display: "block", color: "#9a8ba6", fontSize: "11px" }}>{collab.email}</small>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <span style={{ fontSize: "11px", color: "#9a8ba6", fontWeight: "500", minWidth: "60px", textAlign: "right" }}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .coll-status {
          margin-top: 20px;
          padding: 16px;
          border: 1px solid #e5e1ea;
          border-radius: 12px;
          background: #fcfaff;
        }

        .coll-status-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          font-size: 11px;
          font-weight: 900;
          color: #5a4965;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .coll-status-header em {
          font-style: normal;
          color: #8b7d95;
          font-weight: 600;
        }

        .coll-status-list {
          display: grid;
          gap: 12px;
        }

        .coll-status-badge {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #e9ddfb;
          transition: all 0.2s ease;
        }

        .coll-status-badge:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border-color: #dfc8f0;
        }

        .coll-status-badge.confirmed {
          border-color: #c5e4c3;
          background: #fafffe;
        }

        .coll-status-badge.pending {
          border-color: #f0deb8;
          background: #fffbf8;
        }

        .coll-status-badge.overdue {
          border-color: #f5d1cc;
          background: #fff9f8;
        }

        .coll-status-loading,
        .coll-status-error {
          padding: 12px;
          font-size: 12px;
          color: #9a88a6;
        }

        .coll-status-error {
          color: #b55e51;
        }
      `}</style>
    </div>
  );
}
