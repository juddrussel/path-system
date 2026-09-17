import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .float { animation: float 3s ease-in-out infinite; }
        .blob { animation: blob 7s infinite; }
      `}</style>

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 blob" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 blob animation-delay-4000" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg">
        {/* Logo */}
        <div className="float mb-8">
          <img
            src={logoImg}
            alt="DS PATH"
            className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
          />
        </div>

        {/* 404 Number */}
        <div className="mb-4">
          <h1 className="text-9xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            404
          </h1>
        </div>

        {/* Messages */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Oops! The page you're looking for has gone on an adventure. It might have been moved or deleted.
        </p>

        {/* Decorative elements */}
        <div className="mb-10 space-y-2">
          <div className="inline-flex gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200 transform hover:scale-105"
          >
            Go Back
          </button>
        </div>

        {/* Footer text */}
        <p className="mt-12 text-sm text-gray-500">
          Need help? Contact{" "}
          <a href="mailto:support@dspath.com" className="text-purple-600 hover:underline font-medium">
            support@dspath.com
          </a>
        </p>
      </div>
    </div>
  );
}
