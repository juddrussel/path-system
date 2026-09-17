import { useState } from "react";

export default function TermsModal({ isOpen, onAccept, onDecline }) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e) => {
    const target = e.target;
    const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 20;
    if (scrolledToBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  const handleCheckboxClick = (e) => {
    if (!hasScrolled) {
      e.preventDefault();
      return;
    }
    setAgreed(e.target.checked);
  };

  const handleAccept = () => {
    if (agreed && hasScrolled) {
      onAccept();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .terms-modal-overlay {
          animation: modalFadeIn 0.3s ease-out;
        }
        
        .terms-modal-content {
          animation: modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .terms-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .terms-scrollbar::-webkit-scrollbar-track {
          background: #f8f7ff;
          border-radius: 4px;
        }
        
        .terms-scrollbar::-webkit-scrollbar-thumb {
          background: #d1c9e0;
          border-radius: 4px;
        }
        
        .terms-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b8adc9;
        }
      `}</style>

      {/* Overlay */}
      <div
        className="terms-modal-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(31, 21, 51, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Modal */}
        <div
          className="terms-modal-content"
          style={{
            background: "#fff",
            borderRadius: 20,
            maxWidth: 680,
            width: "100%",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 60px rgba(124, 58, 237, 0.3)",
            border: "1px solid rgba(124, 58, 237, 0.1)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%)",
              padding: "36px 40px 32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ position: "absolute", bottom: -30, left: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", background: "rgba(255,255,255,0.15)", borderRadius: 20, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>Action Required</span>
              </div>
              <h2 style={{ 
                fontSize: 36, 
                fontWeight: 800, 
                color: "#fff", 
                margin: "0 0 12px 0",
                letterSpacing: "-0.02em",
                fontFamily: "'Manrope', sans-serif",
                lineHeight: 1.15,
              }}>
                Terms & Conditions
              </h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.92)", margin: 0, lineHeight: 1.5 }}>
                Please review and accept our terms to continue
              </p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div
            className="terms-scrollbar"
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "36px 40px",
              lineHeight: 1.8,
              color: "#494454",
              fontSize: 13,
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f1533", marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>
                Agreement to Terms
              </h3>
              <p style={{ marginBottom: 14 }}>
                By creating an account and using DS PATH, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the terms of this agreement, you are not authorized to use or access this service.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f1533", marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>
                Use License
              </h3>
              <p style={{ marginBottom: 10 }}>Permission is granted to use DS PATH for lawful purposes only. You may not:</p>
              <ul style={{ marginLeft: 20, marginBottom: 0, lineHeight: 1.9 }}>
                <li style={{ marginBottom: 8 }}>Modify, copy, or misuse platform materials</li>
                <li style={{ marginBottom: 8 }}>Use the service for unauthorized commercial purposes</li>
                <li style={{ marginBottom: 8 }}>Attempt to decompile or reverse engineer any software</li>
                <li style={{ marginBottom: 8 }}>Remove any copyright or proprietary notations</li>
                <li>Share or transfer your account credentials</li>
              </ul>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f1533", marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>
                User Responsibilities
              </h3>
              <p style={{ marginBottom: 10 }}>You are responsible for:</p>
              <ul style={{ marginLeft: 20, marginBottom: 0, lineHeight: 1.9 }}>
                <li style={{ marginBottom: 8 }}>Maintaining the confidentiality of your account</li>
                <li style={{ marginBottom: 8 }}>All activities that occur under your account</li>
                <li style={{ marginBottom: 8 }}>Ensuring the accuracy of information you provide</li>
                <li>Compliance with all applicable laws and regulations</li>
              </ul>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f1533", marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>
                Privacy & Data
              </h3>
              <p>
                We collect and process your personal information in accordance with our Privacy Policy. By accepting these terms, you acknowledge that you have read and understood how we collect, use, and protect your data. Your documents and personal information will be handled with appropriate security measures.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f1533", marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>
                Disclaimer
              </h3>
              <p>
                The service is provided "as is" without warranties of any kind, either expressed or implied. DS PATH makes no warranties regarding availability, reliability, or fitness for a particular purpose. We reserve the right to modify or discontinue the service at any time.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f1533", marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>
                Limitation of Liability
              </h3>
              <p>
                In no event shall DS PATH or its suppliers be liable for any damages (including data loss, business interruption, or lost profits) arising out of the use or inability to use the service, even if DS PATH has been notified of the possibility of such damage.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f1533", marginBottom: 12, fontFamily: "'Manrope', sans-serif" }}>
                Modifications
              </h3>
              <p>
                DS PATH may revise these terms at any time without prior notice. By continuing to use the service after changes are posted, you agree to be bound by the revised terms. We recommend reviewing these terms periodically.
              </p>
            </div>

            <div style={{ padding: "20px 24px", background: "#f8f7ff", borderRadius: 12, border: "1px solid #e9e1f1" }}>
              <p style={{ fontSize: 12, color: "#82768a", margin: 0, textAlign: "center" }}>
                Last updated: <strong style={{ color: "#2f2638" }}>{new Date().toLocaleDateString()}</strong>
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "28px 40px",
              borderTop: "1px solid #e9e1f1",
              background: "#fafafa",
            }}
          >
            {/* Checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 22,
                cursor: hasScrolled ? "pointer" : "not-allowed",
                userSelect: "none",
                opacity: hasScrolled ? 1 : 0.5,
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={handleCheckboxClick}
                disabled={!hasScrolled}
                style={{
                  width: 22,
                  height: 22,
                  marginTop: 2,
                  cursor: hasScrolled ? "pointer" : "not-allowed",
                  accentColor: "#7c3aed",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, color: "#494454", lineHeight: 1.6 }}>
                I have read and agree to the <strong style={{ color: "#2f2638" }}>Terms & Conditions</strong> and <strong style={{ color: "#2f2638" }}>Privacy Policy</strong>
              </span>
            </label>

            {/* Scroll Reminder */}
            {!hasScrolled && (
              <div style={{ 
                marginBottom: 16, 
                padding: "12px 16px", 
                background: "#fef3c7", 
                borderRadius: 10, 
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                gap: 10
              }}>
                <span style={{ fontSize: 18 }}>⬇️</span>
                <span style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5, fontWeight: 600 }}>
                  Please scroll to the bottom to continue
                </span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 14 }}>
              <button
                onClick={onDecline}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  background: "transparent",
                  color: "#82768a",
                  border: "1px solid #e9e1f1",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8f7ff";
                  e.currentTarget.style.borderColor = "#d1c9e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "#e9e1f1";
                }}
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={!agreed || !hasScrolled}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  background: (agreed && hasScrolled) ? "#7c3aed" : "#d1c9e0",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: (agreed && hasScrolled) ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  boxShadow: (agreed && hasScrolled) ? "0 4px 12px rgba(124, 58, 237, 0.25)" : "none",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (agreed && hasScrolled) {
                    e.currentTarget.style.background = "#6b21a8";
                  }
                }}
                onMouseLeave={(e) => {
                  if (agreed && hasScrolled) {
                    e.currentTarget.style.background = "#7c3aed";
                  }
                }}
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
