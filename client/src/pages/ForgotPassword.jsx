import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return; }

    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: "success", text: "If that email is registered, a reset link has been sent. Check your inbox." });
        setEmail("");
      } else {
        setAlertMsg({ type: "error", text: data.message || "Something went wrong. Please try again." });
      }
    } catch {
      setAlertMsg({ type: "error", text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen font-sans">

      {/* LEFT — Hero Panel */}
      <div
        className="w-[38%] relative flex items-end p-11 min-h-screen"
        style={{ background: "url('/images/office2.png') center/cover no-repeat" }}
      >
        <div className="absolute inset-0 bg-[rgba(230,220,255,0.88)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-[30px] h-[30px] border-2 border-[#7c3aed] rounded-[6px] flex items-center justify-center overflow-hidden">
              <img src="/images/path.png" alt="PATH" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold text-[#7c3aed] tracking-[2px]">PATH</span>
          </div>
          <span className="inline-block text-[11px] font-bold bg-[rgba(139,92,246,0.12)] text-[#7c3aed] px-3 py-1 rounded-full mb-4">
            Account Recovery
          </span>
          <h2 className="text-[30px] font-bold leading-tight text-gray-900 mb-4">
            Reset Your <span className="text-[#7c3aed]">Password.</span>
          </h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Enter your registered email address and we'll send you a secure link to reset your password.
          </p>
        </div>
      </div>

      {/* RIGHT — Form Panel */}
      <div className="w-[62%] bg-[#f5f5f5] flex items-center justify-center p-10">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.07)] p-11 w-full max-w-[480px]">

          {/* Icon */}
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" width="24" height="24">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            No worries. Enter your email and we'll send you a reset link.
          </p>

          {alertMsg && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium text-white ${alertMsg.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
              {alertMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="juan@example.com"
                className={`w-full px-3 py-2.5 border rounded-[7px] text-sm outline-none focus:border-[#7c3aed] transition-colors ${error ? "border-red-400" : "border-gray-300"}`}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-[15px] rounded-lg transition-colors disabled:opacity-60 mb-4"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <a
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#7c3aed] transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                <path d="M10 12L6 8l4-4" strokeLinecap="round"/>
              </svg>
              Back to Login
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}
