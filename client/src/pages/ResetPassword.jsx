import { useState, useEffect } from "react";

export default function ResetPassword() {
  const [form, setForm] = useState({ password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null=checking, true=valid, false=invalid

  const token = new URLSearchParams(window.location.search).get("token");

  // Verify token on mount
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-reset-token?token=${token}`)
      .then(res => setTokenValid(res.ok))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!form.confirm_password) errs.confirm_password = "Please confirm your password.";
    else if (form.password !== form.confirm_password) errs.confirm_password = "Passwords do not match.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: "success", text: "Password reset successfully! Redirecting to login..." });
        setTimeout(() => (window.location.href = "/login"), 2500);
      } else {
        setAlertMsg({ type: "error", text: data.message || "Failed to reset password." });
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
            Create a New <span className="text-[#7c3aed]">Password.</span>
          </h2>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Choose a strong password to secure your workspace account.
          </p>
        </div>
      </div>

      {/* RIGHT — Form Panel */}
      <div className="w-[62%] bg-[#f5f5f5] flex items-center justify-center p-10">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.07)] p-11 w-full max-w-[480px]">

          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" width="24" height="24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>

          {/* Token checking state */}
          {tokenValid === null && (
            <p className="text-sm text-gray-500">Verifying reset link...</p>
          )}

          {/* Invalid token */}
          {tokenValid === false && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Link Expired</h2>
              <p className="text-sm text-gray-500 mb-6">
                This password reset link is invalid or has expired (links expire after 1 hour).
              </p>
              <a
                href="/forgot-password"
                className="block w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-[15px] rounded-lg transition-colors text-center"
              >
                Request New Reset Link
              </a>
            </>
          )}

          {/* Valid token — show form */}
          {tokenValid === true && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your new password below.</p>

              {alertMsg && (
                <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium text-white ${alertMsg.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
                  {alertMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`w-full px-3 py-2.5 border rounded-[7px] text-sm outline-none focus:border-[#7c3aed] transition-colors ${errors.password ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm New Password *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`w-full px-3 py-2.5 border rounded-[7px] text-sm outline-none focus:border-[#7c3aed] transition-colors ${errors.confirm_password ? "border-red-400" : "border-gray-300"}`}
                  />
                  {errors.confirm_password
                    ? <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
                    : <p className="text-[11px] text-gray-400 mt-1">Passwords must match exactly.</p>
                  }
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-[15px] rounded-lg transition-colors disabled:opacity-60 mb-4"
                >
                  {loading ? "Resetting..." : "Reset Password"}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
