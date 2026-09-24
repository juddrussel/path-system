import React, { useState, useEffect } from "react";

/**
 * TaskChangelog
 * Timeline view of all field changes with before/after values.
 * Collapsible entries, shows who made the change and when.
 */
export default function TaskChangelog({ taskId, token, apiUrl }) {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    const loadChangelog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/tasks/${taskId}/changelog?limit=50&offset=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load changelog");
        const data = await res.json();
        setChanges(data.changes || []);
      } catch (err) {
        setError(err.message);
        console.error("TaskChangelog error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId && token) loadChangelog();
  }, [taskId, token, apiUrl]);

  const toggleExpand = (changeId) => {
    const updated = new Set(expandedIds);
    if (updated.has(changeId)) {
      updated.delete(changeId);
    } else {
      updated.add(changeId);
    }
    setExpandedIds(updated);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatFieldName = (field) => {
    return field
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const truncateValue = (value, length = 50) => {
    if (!value) return "(empty)";
    const str = String(value);
    return str.length > length ? str.substring(0, length) + "..." : str;
  };

  if (loading) return <div className="tc-loading">Loading changelog...</div>;
  if (error) return <div className="tc-error">Error: {error}</div>;

  return (
    <div className="tc-container">
      <div className="tc-header">
        <span>Task Change History</span>
        <em>{changes.length} change{changes.length !== 1 ? "s" : ""}</em>
      </div>

      {changes.length === 0 ? (
        <div className="tc-empty">No changes recorded yet.</div>
      ) : (
        <div className="tc-timeline">
          {changes.map((change) => {
            const isExpanded = expandedIds.has(change.id);
            return (
              <div key={change.id} className="tc-entry">
                <button
                  className="tc-entry-header"
                  onClick={() => toggleExpand(change.id)}
                  type="button"
                >
                  <span className="tc-toggle">{isExpanded ? "▼" : "▶"}</span>
                  <span className="tc-field">{formatFieldName(change.fieldName)}</span>
                  <span className="tc-meta">
                    by <strong>{change.changedByName}</strong> on{" "}
                    <time>{formatTime(change.changedAt)}</time>
                  </span>
                </button>

                {isExpanded && (
                  <div className="tc-entry-details">
                    <div className="tc-change-pair">
                      <div className="tc-before">
                        <span className="tc-label">Before</span>
                        <code>{truncateValue(change.oldValue)}</code>
                      </div>
                      <div className="tc-arrow">→</div>
                      <div className="tc-after">
                        <span className="tc-label">After</span>
                        <code>{truncateValue(change.newValue)}</code>
                      </div>
                    </div>

                    {(change.oldValue?.length > 50 || change.newValue?.length > 50) && (
                      <details className="tc-full-view">
                        <summary>View full values</summary>
                        <div className="tc-full-before">
                          <strong>Full Before:</strong>
                          <pre>{change.oldValue || "(empty)"}</pre>
                        </div>
                        <div className="tc-full-after">
                          <strong>Full After:</strong>
                          <pre>{change.newValue || "(empty)"}</pre>
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .tc-container {
          margin-top: 20px;
          padding: 14px 16px;
          border: 1px solid #e0d5ef;
          border-radius: 10px;
          background: #fcfaff;
        }

        .tc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 800;
          color: #4a3a55;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          border-bottom: 1px solid #e9ddfb;
          padding-bottom: 8px;
        }

        .tc-header em {
          font-style: normal;
          color: #9a8ba6;
        }

        .tc-loading,
        .tc-error,
        .tc-empty {
          padding: 12px;
          font-size: 12px;
          color: #9a88a6;
          text-align: center;
        }

        .tc-error {
          color: #b55e51;
        }

        .tc-timeline {
          display: grid;
          gap: 8px;
          margin-top: 8px;
        }

        .tc-entry {
          border: 1px solid #e9ddfb;
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
        }

        .tc-entry-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s;
          font-size: 12px;
        }

        .tc-entry-header:hover {
          background: #fafaf0;
        }

        .tc-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          flex-shrink: 0;
          color: #9a8ba6;
          font-size: 10px;
        }

        .tc-field {
          font-weight: 800;
          color: #4a3a55;
          flex-shrink: 0;
        }

        .tc-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
          color: #9a88a6;
          font-size: 11px;
          white-space: nowrap;
        }

        .tc-meta strong {
          color: #5d4867;
        }

        .tc-meta time {
          font-family: 'Courier New', monospace;
          font-size: 10px;
        }

        .tc-entry-details {
          padding: 10px;
          border-top: 1px solid #e9ddfb;
          background: #fafbff;
          font-size: 12px;
        }

        .tc-change-pair {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .tc-before,
        .tc-after {
          flex: 1;
          min-width: 0;
        }

        .tc-arrow {
          color: #7c3aed;
          font-weight: 800;
          flex-shrink: 0;
        }

        .tc-label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          color: #9a88a6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }

        .tc-before code {
          display: block;
          padding: 6px;
          border-radius: 4px;
          background: #fff5e6;
          border-left: 2px solid #e1b347;
          color: #8b6914;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          overflow-x: auto;
        }

        .tc-after code {
          display: block;
          padding: 6px;
          border-radius: 4px;
          background: #e8fce4;
          border-left: 2px solid #51ab83;
          color: #2d6b52;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          overflow-x: auto;
        }

        .tc-full-view {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e9ddfb;
        }

        .tc-full-view summary {
          cursor: pointer;
          color: #7c3aed;
          font-size: 11px;
          font-weight: 800;
        }

        .tc-full-view[open] {
          padding: 8px;
          background: rgba(124, 58, 237, 0.04);
          border-radius: 4px;
        }

        .tc-full-before,
        .tc-full-after {
          margin-top: 8px;
        }

        .tc-full-before strong,
        .tc-full-after strong {
          display: block;
          font-size: 11px;
          color: #9a88a6;
          margin-bottom: 4px;
        }

        .tc-full-before pre,
        .tc-full-after pre {
          margin: 0;
          padding: 8px;
          border-radius: 4px;
          background: #fff;
          border: 1px solid #e9ddfb;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          overflow-x: auto;
          max-height: 150px;
          max-width: 100%;
        }

        .tc-full-before pre {
          border-left: 2px solid #e1b347;
          color: #8b6914;
        }

        .tc-full-after pre {
          border-left: 2px solid #51ab83;
          color: #2d6b52;
        }
      `}</style>
    </div>
  );
}
