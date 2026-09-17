import { useState } from "react";
import { ArrowRight, ScrollText, X } from "lucide-react";

export default function TermsModal({ isOpen, onAccept, onDecline }) {
  const [accepted, setAccepted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

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
    setAccepted(e.target.checked);
  };

  const handleAccept = () => {
    if (accepted && hasScrolled) {
      onAccept();
    }
  };

  return (
    <div className="path-terms-overlay" role="presentation">
      <style>{`
        .path-terms-overlay {
          position: fixed;
          z-index: 20;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(42, 25, 63, .48);
          backdrop-filter: blur(7px);
          font-family: "DM Sans", Arial, sans-serif;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .path-terms-modal {
          position: relative;
          width: min(100%, 540px);
          max-height: min(720px, calc(100dvh - 48px));
          overflow: auto;
          border: 1px solid rgba(255, 255, 255, .72);
          border-radius: 22px;
          padding: 30px;
          background: #fffdfd;
          color: #40344b;
          box-shadow: 0 28px 80px rgba(38, 20, 65, .28);
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .path-terms-modal::-webkit-scrollbar {
          width: 8px;
        }

        .path-terms-modal::-webkit-scrollbar-track {
          background: transparent;
        }

        .path-terms-modal::-webkit-scrollbar-thumb {
          background: #d1c9e0;
          border-radius: 4px;
        }

        .path-terms-modal::-webkit-scrollbar-thumb:hover {
          background: #b8adc9;
        }

        .path-terms-close {
          position: absolute;
          top: 19px;
          right: 19px;
          display: grid;
          width: 31px;
          height: 31px;
          place-items: center;
          border: 1px solid #ebe3f0;
          border-radius: 9px;
          background: #fff;
          color: #897b91;
          cursor: pointer;
          transition: all 0.2s;
        }

        .path-terms-close:hover {
          background: #f8f7ff;
          border-color: #d1c9e0;
        }

        .path-terms-icon {
          display: grid;
          width: 45px;
          height: 45px;
          margin-bottom: 18px;
          place-items: center;
          border-radius: 14px;
          background: #f0eaff;
          color: #7134d6;
        }

        .path-terms-kicker {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #9b89ad;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .path-terms-kicker i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .path-terms-modal h2 {
          margin: 11px 0 7px;
          color: #33293c;
          font: 800 30px / 1.1 "Manrope", Arial, sans-serif;
          letter-spacing: -.055em;
        }

        .path-terms-lede {
          max-width: 420px;
          margin: 0;
          color: #82768a;
          font-size: 12px;
          line-height: 1.55;
        }

        .path-terms-scroll {
          max-height: 300px;
          overflow-y: auto;
          margin: 22px 0 18px;
          padding: 17px 18px;
          border: 1px solid #ece5f1;
          border-radius: 13px;
          background: #fbf9fd;
          scrollbar-color: #c9b8da transparent;
        }

        .path-terms-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .path-terms-scroll::-webkit-scrollbar-track {
          background: #fbf9fd;
          border-radius: 4px;
        }

        .path-terms-scroll::-webkit-scrollbar-thumb {
          background: #d1c9e0;
          border-radius: 4px;
        }

        .path-terms-scroll::-webkit-scrollbar-thumb:hover {
          background: #b8adc9;
        }

        .path-terms-scroll h3 {
          margin: 0 0 5px;
          color: #5f3b91;
          font: 800 11px / 1.3 "Manrope", Arial, sans-serif;
        }

        .path-terms-scroll h3:not(:first-child) {
          margin-top: 17px;
        }

        .path-terms-scroll p {
          margin: 0;
          color: #756783;
          font-size: 11px;
          line-height: 1.62;
        }

        .path-terms-updated {
          margin-top: 17px !important;
          color: #a095a8 !important;
          font-size: 9px !important;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .path-terms-scroll-hint {
          margin-top: 12px;
          padding: 10px 12px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #92400e;
          font-weight: 600;
        }

        .path-terms-check {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          color: #5d5066;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.45;
          cursor: var(--cursor-type);
          opacity: var(--checkbox-opacity);
          margin-top: 18px;
          transition: all 0.2s;
        }

        .path-terms-check input {
          flex: 0 0 auto;
          width: 15px;
          height: 15px;
          margin: 1px 0 0;
          accent-color: #7c3aed;
          cursor: var(--cursor-type);
        }

        .path-terms-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 23px;
        }

        .path-terms-cancel,
        .path-terms-accept {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 8px;
          font: 800 10px "DM Sans", Arial, sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .path-terms-cancel {
          border: 1px solid #e2dbe8;
          background: #fff;
          color: #7f7188;
        }

        .path-terms-cancel:hover {
          background: #f8f7ff;
          border-color: #d1c9e0;
        }

        .path-terms-accept {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #7134d6;
          background: #7c3aed;
          color: #fff;
          box-shadow: 0 9px 17px rgba(124, 58, 237, .23);
        }

        .path-terms-accept:hover:not(:disabled) {
          background: #6b21a8;
          border-color: #6b21a8;
        }

        .path-terms-accept:disabled {
          border-color: #d9d1e2;
          background: #d9d1e2;
          box-shadow: none;
          cursor: not-allowed;
        }

        .path-terms-cancel:active:not(:disabled),
        .path-terms-accept:active:not(:disabled) {
          transform: scale(.97);
        }

        @media (max-width: 520px) {
          .path-terms-overlay { padding: 14px; }
          .path-terms-modal {
            max-height: calc(100dvh - 28px);
            border-radius: 17px;
            padding: 24px 19px 20px;
          }
          .path-terms-modal h2 { font-size: 27px; }
          .path-terms-scroll { max-height: 250px; padding: 15px; }
          .path-terms-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }
          .path-terms-cancel,
          .path-terms-accept {
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>

      <section
        className="path-terms-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="path-terms-title"
      >
        <button
          className="path-terms-close"
          type="button"
          onClick={onDecline}
          aria-label="Close terms and conditions"
        >
          <X size={17} />
        </button>

        <div className="path-terms-icon" aria-hidden="true">
          <ScrollText size={21} strokeWidth={1.8} />
        </div>
        <span className="path-terms-kicker">
          <i /> Before you continue
        </span>
        <h2 id="path-terms-title">Terms &amp; Conditions</h2>
        <p className="path-terms-lede">
          Please review the guidelines before completing your registration.
        </p>

        <div className="path-terms-scroll" onScroll={handleScroll} tabIndex={0}>
          <h3>Use of the PATH workspace</h3>
          <p>
            PATH is an academic document workflow platform used by authorized faculty, program chairs, and administrators. You agree to use the workspace only for legitimate department business and academic purposes.
          </p>

          <h3>Accuracy and responsibility</h3>
          <p>
            You are responsible for the accuracy of information and files you submit, and for keeping your sign-in credentials private. Do not upload confidential material unless you are authorized to do so.
          </p>

          <h3>Review and access</h3>
          <p>
            Your account request will be manually reviewed by an administrator. Access may be limited or removed when workspace rules, university policy, or applicable law is not followed.
          </p>

          <h3>Data privacy</h3>
          <p>
            Your personal information will be handled in accordance with our Privacy Policy. We protect your data with appropriate security measures and only use it for legitimate business purposes.
          </p>

          <h3>Disclaimer</h3>
          <p>
            The service is provided "as is" without warranties of any kind. We reserve the right to modify or discontinue the service at any time with appropriate notice.
          </p>

          <p className="path-terms-updated">Last updated · September 2026</p>
        </div>

        {!hasScrolled && (
          <div className="path-terms-scroll-hint">
            <span>⬇️</span>
            <span>Please scroll to the bottom to continue</span>
          </div>
        )}

        <label 
          className="path-terms-check"
          style={{
            "--cursor-type": hasScrolled ? "pointer" : "not-allowed",
            "--checkbox-opacity": hasScrolled ? 1 : 0.5,
          }}
        >
          <input
            type="checkbox"
            checked={accepted}
            onChange={handleCheckboxClick}
            disabled={!hasScrolled}
          />
          <span>I have read and agree to the PATH Terms &amp; Conditions.</span>
        </label>

        <div className="path-terms-actions">
          <button
            className="path-terms-cancel"
            type="button"
            onClick={onDecline}
          >
            Go back
          </button>
          <button
            className="path-terms-accept"
            type="button"
            disabled={!accepted || !hasScrolled}
            onClick={handleAccept}
          >
            Accept &amp; continue <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
