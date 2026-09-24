import React, { useState, useEffect } from "react";

/**
 * CollaborationStatus
 * Unified card showing mutual confirmation status + list of collaborators.
 * Shows who has confirmed their edits with visual indicators.
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

  if (loading) return <div className="coll-card-loading">Loading collaborators...</div>;
  if (error) return <div className="coll-card-error">Error: {error}</div>;
  if (collaborators.length === 0) return null;

  const confirmedCount = collaborators.filter(c => c.confirmedAt).length;
  const allConfirmed = confirmedCount === collaborators.length;

  return (
    <div className="coll-card">
      <div className="coll-card-header">
        <div>
          <span className="coll-card-label">Collaboration</span>
          <h3 className="coll-card-title">Mutual confirmation status</h3>
        </div>
        <div className="coll-card-badge" style={{
          background: allConfirmed ? "#d4edda" : "#fff3cd",
          color: allConfirmed ? "#155724" : "#856404"
        }}>
          {allConfirmed ? `✓ ${confirmedCount} confirmed` : `⏳ ${confirmedCount}/${collaborators.length} confirmed`}
        </div>
      </div>

      <p className="coll-card-description">
        All {collaborators.length} collaborator{collaborators.length !== 1 ? "s" : ""} must confirm their edits before the task can be submitted for review.
      </p>

      <div className="coll-card-list">
        {collaborators.map((collab) => {
          const confirmedAt = collab.confirmedAt ? new Date(collab.confirmedAt) : null;
          const isConfirmed = !!confirmedAt;

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
            <div key={collab.userId} className={`coll-card-item ${isConfirmed ? "confirmed" : "pending"}`}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: bgColor,
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </div>
                {isConfirmed && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      background: "#10b981",
                      color: "#fff",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "bold",
                      border: "2px solid #fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "2px" }}>
                  <strong style={{ fontSize: "13px", color: "#3a2a45" }}>{collab.fullName}</strong>
                  {isConfirmed && (
                    <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 600 }}>Confirmed</span>
                  )}
                </div>
                <small style={{ display: "block", color: "#9a8ba6", fontSize: "11px" }}>{collab.email}</small>
              </div>

              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: isConfirmed ? "#10b981" : "#b8a8c0",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: isConfirmed ? "#f0fdf4" : "#f5f3f8"
                }}>
                  {isConfirmed ? "✓" : "○"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .coll-card {
          margin: 16px 0;
          padding: 16px;
          border: 1px solid #e5e1ea;
          border-radius: 12px;
          background: #fcfaff;
        }

        .coll-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .coll-card-label {
          display: block;
          font-size: 10px;
          font-weight: 900;
          color: #9a8ba6;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 2px;
        }

        .coll-card-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: #3a2a45;
        }

        .coll-card-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .coll-card-description {
          margin: 0 0 14px 0;
          font-size: 13px;
          color: #6b5f76;
          line-height: 1.5;
        }

        .coll-card-list {
          display: grid;
          gap: 10px;
        }

        .coll-card-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #e9ddfb;
          transition: all 0.2s ease;
        }

        .coll-card-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border-color: #dfc8f0;
        }

        .coll-card-item.confirmed {
          border-color: #c5e4c3;
          background: #f7fcf5;
        }

        .coll-card-item.pending {
          border-color: #f0deb8;
          background: #fffbf8;
        }

        .coll-card-loading,
        .coll-card-error {
          padding: 12px;
          font-size: 12px;
          color: #9a88a6;
          text-align: center;
        }

        .coll-card-error {
          color: #b55e51;
        }
      `}</style>
    </div>
  );
}
