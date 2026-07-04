import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError("Please enter both email and password");
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // Password validation
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setIsLoading(false);
        return;
      }

      // Call login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse login response:", responseText);
        setError("Server error. Please try again later.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Login failed");
        setIsLoading(false);
        return;
      }

      if (data.success && data.tokens) {
        // Store tokens and user data
        localStorage.setItem("accessToken", data.tokens.access_token);
        localStorage.setItem("refreshToken", data.tokens.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("business", JSON.stringify(data.business));

        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-5rem)]">
        <div className="max-w-md mx-auto">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-border p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Sign in to your Q Pay business account
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-accent">Login successful! Redirecting...</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-foreground placeholder:text-muted-foreground transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-foreground placeholder:text-muted-foreground transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? "Signing in..." : success ? "Redirecting..." : "Sign In"}
                {!isLoading && !success && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">Don't have an account?</span>
              </div>
            </div>

            {/* Sign Up Links */}
            <div className="space-y-2">
              <button
                onClick={() => navigate("/register/sme")}
                className="w-full border border-border text-foreground py-2.5 rounded-lg font-medium hover:bg-muted transition-all"
              >
                Start Free (SME)
              </button>
              <button
                onClick={() => navigate("/register/enterprise")}
                className="w-full border border-secondary text-foreground py-2.5 rounded-lg font-medium hover:bg-secondary/5 transition-all"
              >
                Enterprise Setup
              </button>
            </div>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground space-y-1">
              <p>
                <Link to="/" className="text-primary hover:underline">
                  Back to Home
                </Link>
              </p>
              <p>
                <a href="#" className="text-primary hover:underline">
                  Security & Privacy
                </a>
              </p>
            </div>
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-900">
              <strong>Demo Login:</strong> demo@qpay.io / DemoPass123!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
