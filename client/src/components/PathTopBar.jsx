import { ArrowRight } from "lucide-react";
import logoImg from "../assets/logo.png";

/**
 * Reusable DS PATH branded topbar for consistent header styling across pages
 * Used on 404, error pages, and other utility pages
 */
export default function PathTopBar({ subtitle = "Academic workflow operations" }) {
  return (
    <header className="path-topbar">
      <div className="path-topbar-brand">
        <img src={logoImg} alt="DS PATH" className="path-topbar-logo" />
        <span>
          <strong>DS PATH</strong>
          <small>Processing &amp; Tracking Hub</small>
        </span>
      </div>
      <div className="path-topbar-right">
        <i /> {subtitle} <ArrowRight size={13} />
      </div>
      <style>{`
        .path-topbar {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 25px clamp(24px, 5vw, 72px);
          border-bottom: 1px solid rgba(224, 216, 238, 0.78);
          background: rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(12px);
        }
        .path-topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .path-topbar-logo {
          width: 35px;
          height: 35px;
          border-radius: 10px;
          object-fit: cover;
        }
        .path-topbar-brand strong {
          display: block;
          font-size: 16px;
          letter-spacing: 0.12em;
          font-family: "Manrope", Arial, sans-serif;
          font-weight: 800;
        }
        .path-topbar-brand small {
          display: block;
          margin-top: 3px;
          color: #a095a8;
          font-size: 7px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: "Manrope", Arial, sans-serif;
        }
        .path-topbar-right {
          display: flex;
          align-items: center;
          gap: 17px;
          color: #a095a8;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          font-family: "Manrope", Arial, sans-serif;
        }
        .path-topbar-right i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7c3aed;
        }
        @media (max-width: 800px) {
          .path-topbar {
            padding: 18px 20px;
          }
          .path-topbar-right {
            font-size: 8px;
          }
        }
      `}</style>
    </header>
  );
}
