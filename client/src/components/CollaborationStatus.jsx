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

          return (
            <div key={collab.userId} className={`coll-status-badge coll-status-${statusClass}`}>
              <span className="coll-status-icon">{icon}</span>
              <div>
                <strong>{collab.fullName}</strong>
                <small>{collab.email}</small>
              </div>
              <em>{label}</em>
            </div>
          );
        })}
      </div>

      <style>{`
        .coll-status {
          margin-top: 20px;
          padding: 14px 16px;
          border: 1px solid #e0d5ef;
          border-radius: 10px;
          background: #fcfaff;
        }

        .coll-status-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 800;
          color: #4a3a55;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .coll-status-header em {
          font-style: normal;
          color: #9a8ba6;
        }

        .coll-status-list {
          display: grid;
          gap: 8px;
        }

        .coll-status-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #e9ddfb;
        }

        .coll-status-badge.confirmed {
          border-color: #c5e4c3;
          background: #f5fbf8;
        }

        .coll-status-badge.pending {
          border-color: #f4e4c1;
          background: #fffbf0;
        }

        .coll-status-badge.overdue {
          border-color: #f5d1cc;
          background: #fff9f8;
        }

        .coll-status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 800;
        }

        .coll-status-confirmed .coll-status-icon {
          background: #d4f3d0;
          color: #51ab83;
        }

        .coll-status-pending .coll-status-icon {
          background: #fde8c6;
          color: #e1b347;
        }

        .coll-status-overdue .coll-status-icon {
          background: #fad4ce;
          color: #dc7365;
        }

        .coll-status-badge > div {
          flex: 1;
          min-width: 0;
        }

        .coll-status-badge strong {
          display: block;
          font-size: 12px;
          color: #4a3a55;
        }

        .coll-status-badge small {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          color: #9a8ba6;
        }

        .coll-status-badge em {
          font-style: normal;
          white-space: nowrap;
          font-size: 11px;
          color: #8d7e98;
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
