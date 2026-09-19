import { ArrowLeft } from "lucide-react";

/**
 * Reusable DS PATH branded footer for consistent footer styling across pages
 * Used on 404, error pages, and other utility pages
 */
export default function PathFooter() {
  return (
    <footer className="path-footer">
      <span>
        <i /> DS PATH · Processing &amp; Tracking Hub
      </span>
      <span>
        <ArrowLeft size={12} /> Nothing is lost in the record
      </span>
      <style>{`
        .path-footer {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px clamp(24px, 5vw, 72px);
          border-top: 1px solid rgba(224, 216, 238, 0.78);
          color: #a095a8;
          font-size: 9px;
          font-family: "Manrope", Arial, sans-serif;
        }
        .path-footer span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .path-footer i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c4b5fd;
        }
        @media (max-width: 800px) {
          .path-footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
            padding: 18px 20px;
          }
        }
      `}</style>
    </footer>
  );
}
