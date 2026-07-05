import { useState } from "react";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required.";
    if (!formData.password) newErrors.password = "Password is required.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setAlertMsg({ type: "success", text: "Login successful! Redirecting..." });
        setTimeout(() => (window.location.href = "/dashboard"), 1500);
      } else {
        setAlertMsg({ type: "error", text: data.message || "Invalid credentials." });
      }
    } catch {
      setAlertMsg({ type: "error", text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen font-sans">

      {/* LEFT — Login Card */}
      <div className="w-[55%] bg-[#f5f5f5] flex items-center justify-center p-10">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.07)] p-11 w-full max-w-[460px]">

          {/* Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-[#7c3aed] rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/images/path.png" alt="PATH" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold text-[#7c3aed] tracking-[2px]">PATH</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Please enter your credentials to access your workspace.</p>

          {/* Alert */}
          {alertMsg && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium text-white ${alertMsg.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
              {alertMsg.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:border-[#7c3aed] transition-colors ${errors.username ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none focus:border-[#7c3aed] transition-colors ${errors.password ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#7c3aed] hover:bg-[#8371d3] text-white font-bold text-[15px] rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login to Workspace"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 tracking-wider">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Socials */}
          <div className="flex gap-3 mb-5">
            <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Google
            </button>
            <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Microsoft
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-2.5">Don't have an account?</p>
          <a
            href="/register"
            className="block text-center py-3 bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#7c3aed] font-bold text-sm rounded-lg transition-colors"
          >
            Sign up here
          </a>
        </div>
      </div>

      {/* RIGHT — Hero Panel */}
      <div
        className="w-[45%] relative flex items-end p-12"
        style={{ background: "url('/images/office.png') center/cover no-repeat" }}
      >
        <div className="absolute inset-0 bg-[rgba(80,30,160,0.65)]" />
        <div className="relative z-10 text-white">
          <span className="inline-block text-xs bg-white/15 border border-white/30 px-4 py-1.5 rounded-full mb-5">
            Enterprise-grade Security
          </span>
          <h1 className="text-[36px] font-bold leading-tight mb-4">
            Streamlining documents, empowering progress.
          </h1>
          <p className="text-sm text-white/80 leading-relaxed mb-7">
            The next generation of document routing is here. Automate workflows, track every interaction, and maintain total control over your organizational data.
          </p>
          <div className="flex gap-2">
            <span className="w-7 h-[3px] rounded-sm bg-white/35 inline-block" />
            <span className="w-7 h-[3px] rounded-sm bg-white inline-block" />
            <span className="w-7 h-[3px] rounded-sm bg-white/35 inline-block" />
          </div>
        </div>
      </div>

    </div>
  );
}
