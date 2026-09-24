import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Only show on pages OTHER than Inbox
  const isInboxPage = location.pathname === "/inbox";

  if (isInboxPage) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`scroll-to-top ${isVisible ? "show" : ""}`}
      aria-label="Scroll to top"
      title="Back to top"
    >
      ↑
    </button>
  );
}
