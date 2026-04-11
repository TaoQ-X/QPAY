import React, { useState, useEffect } from "react";
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Loader,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreeDSecureProps {
  transactionId: string;
  challengeId: string;
  amount: number;
  cardLast4: string;
  cardBrand: string;
  acsUrl?: string;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

export function ThreeDSecure({
  transactionId,
  challengeId,
  amount,
  cardLast4,
  cardBrand,
  acsUrl,
  onComplete,
  onCancel,
}: ThreeDSecureProps) {
  const [status, setStatus] = useState<"challenge" | "otp" | "success" | "failed" | "loading">(
    "challenge"
  );
  const [otp, setOtp] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [showOtp, setShowOtp] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [challengeComplete, setChallengeComplete] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (status === "success" || status === "failed") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStatus("failed");
          onComplete(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, onComplete]);

  const handleChallengeComplete = () => {
    setChallengeComplete(true);
    setStatus("otp");
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      alert("OTP must be 6 digits");
      return;
    }

    try {
      setStatus("loading");

      const response = await fetch("/api/payments/3ds/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          otp,
          transactionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        onComplete(true);
      } else {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);

        if (newAttempts >= 3) {
          setStatus("failed");
          onComplete(false);
        } else {
          setOtp("");
          setStatus("otp");
        }
      }
    } catch (error) {
      console.error("3D Secure verification error:", error);
      setStatus("failed");
      onComplete(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 text-white max-w-md mx-auto shadow-2xl border border-purple-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold">3D Secure Verification</h2>
      </div>

      {/* Status Messages */}
      {status === "failed" && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="font-semibold text-red-300">Verification Failed</p>
            <p className="text-sm text-red-200">Transaction has been declined</p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <p className="font-semibold text-green-300">Verified Successfully</p>
            <p className="text-sm text-green-200">Transaction approved</p>
          </div>
        </div>
      )}

      {/* Transaction Details */}
      <div className="bg-indigo-800/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-indigo-200 mb-1">Card</p>
        <p className="text-lg font-mono mb-3">
          {cardBrand.toUpperCase()} •••• •••• •••• {cardLast4}
        </p>

        <p className="text-sm text-indigo-200 mb-1">Amount</p>
        <p className="text-3xl font-bold text-blue-300">${amount.toFixed(2)}</p>
      </div>

      {/* Challenge Step */}
      {status === "challenge" && !challengeComplete && (
        <div className="space-y-4">
          <div className="bg-indigo-700/30 border border-indigo-500/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-indigo-100">
              Your card issuer is verifying this transaction
            </p>
            <p className="text-xs text-indigo-300">
              Redirecting to secure authentication page...
            </p>
          </div>

          {acsUrl && (
            <div className="bg-indigo-700/30 border border-indigo-500/50 rounded-lg p-4">
              <p className="text-xs text-indigo-300 mb-2">Secure Server:</p>
              <code className="text-xs text-blue-300 break-all">{acsUrl}</code>
            </div>
          )}

          <button
            onClick={handleChallengeComplete}
            className="w-full py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Continue to Bank Authentication
          </button>

          <button
            onClick={onCancel}
            className="w-full py-3 rounded-lg font-bold bg-indigo-700 hover:bg-indigo-600 text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* OTP Entry Step */}
      {status === "otp" && (
        <div className="space-y-4">
          <p className="text-sm text-indigo-200">
            A verification code has been sent to your phone and email
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-indigo-100">
              Enter 6-Digit Code
            </label>
            <div className="relative">
              <input
                type={showOtp ? "text" : "password"}
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-indigo-700/30 border border-indigo-500/50 rounded-lg text-white placeholder-indigo-400/50 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
              <button
                onClick={() => setShowOtp(!showOtp)}
                className="absolute right-4 top-3 text-indigo-300 hover:text-indigo-100"
              >
                {showOtp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleOtpSubmit}
            disabled={otp.length !== 6 || status === "loading"}
            className={cn(
              "w-full py-3 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2",
              otp.length === 6 && status !== "loading"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-slate-600 cursor-not-allowed"
            )}
          >
            {status === "loading" && <Loader className="w-4 h-4 animate-spin" />}
            {status === "loading" ? "Verifying..." : "Verify Code"}
          </button>

          <button
            onClick={onCancel}
            disabled={status === "loading"}
            className="w-full py-3 rounded-lg font-bold bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-600 text-white transition-colors"
          >
            Cancel
          </button>

          <p className="text-xs text-indigo-300 text-center">
            Didn't receive a code?{" "}
            <button className="text-blue-300 hover:text-blue-200 font-semibold">
              Resend
            </button>
          </p>
        </div>
      )}

      {/* Success Step */}
      {status === "success" && (
        <div className="space-y-4">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-300 mb-2">
              Transaction Approved
            </h3>
            <p className="text-sm text-indigo-200">
              Your payment has been securely verified and processed
            </p>
          </div>

          <button
            onClick={onCancel}
            className="w-full py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Complete
          </button>
        </div>
      )}

      {/* Failed Step */}
      {status === "failed" && (
        <div className="space-y-4">
          <div className="text-center py-6">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-300 mb-2">
              Verification Failed
            </h3>
            <p className="text-sm text-indigo-200">
              {otpAttempts >= 3
                ? "Too many attempts. Please try a different card."
                : "Please try again"}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="w-full py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Timer */}
      {status !== "success" && status !== "failed" && (
        <div className="mt-6 text-center text-xs text-indigo-300">
          <p>
            Time remaining:{" "}
            <span className={timeRemaining < 60 ? "text-red-400 font-bold" : ""}>
              {formatTime(timeRemaining)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
