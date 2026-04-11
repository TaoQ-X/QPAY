import React, { useState, useEffect } from "react";
import { Lock, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface PINpadProps {
  sessionId: string;
  transactionId: string;
  amount: number;
  onComplete: (verified: boolean) => void;
  onCancel: () => void;
}

export function PINpadDevice({
  sessionId,
  transactionId,
  amount,
  onComplete,
  onCancel,
}: PINpadProps) {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<
    "waiting" | "verifying" | "verified" | "failed" | "timeout"
  >("waiting");
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  // Countdown timer
  useEffect(() => {
    if (status !== "waiting" && status !== "verifying") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStatus("timeout");
          onComplete(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, onComplete]);

  const handleNumpadClick = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      alert("PIN must be at least 4 digits");
      return;
    }

    try {
      setStatus("verifying");

      const response = await fetch("/api/payments/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          pin,
          transactionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("verified");
        onComplete(true);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          setStatus("failed");
          onComplete(false);
        } else {
          setStatus("waiting");
          setPin("");
        }
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      setStatus("failed");
      onComplete(false);
    }
  };

  const handleCancel = () => {
    setPin("");
    setStatus("waiting");
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white max-w-sm mx-auto shadow-2xl border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold">Secure PIN Entry</h2>
      </div>

      {/* Status Display */}
      {status === "timeout" && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="font-semibold text-red-300">Session Timeout</p>
            <p className="text-sm text-red-200">Please try again</p>
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="font-semibold text-red-300">PIN Verification Failed</p>
            <p className="text-sm text-red-200">Too many attempts. Transaction declined.</p>
          </div>
        </div>
      )}

      {status === "verified" && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <p className="font-semibold text-green-300">PIN Verified</p>
            <p className="text-sm text-green-200">Transaction approved</p>
          </div>
        </div>
      )}

      {/* Transaction Info */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-300 mb-1">Amount to Process</p>
        <p className="text-3xl font-bold text-green-400">${amount.toFixed(2)}</p>
      </div>

      {/* PIN Display */}
      <div className="bg-slate-700/70 rounded-lg p-4 mb-6 h-16 flex items-center justify-center">
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "w-12 h-12 rounded-lg font-bold text-lg border-2 flex items-center justify-center transition-all",
                pin.length > i
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-slate-600 border-slate-500 text-slate-400"
              )}
            >
              {pin.length > i ? "•" : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumpadClick(num.toString())}
            disabled={status === "verifying" || status === "verified" || pin.length >= 4}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-xl transition-colors"
          >
            {num}
          </button>
        ))}

        {/* Backspace Button */}
        <button
          onClick={handleBackspace}
          disabled={status === "verifying" || status === "verified" || pin.length === 0}
          className="col-span-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-sm transition-colors"
        >
          ← Backspace
        </button>

        {/* 0 Button */}
        <button
          onClick={() => handleNumpadClick("0")}
          disabled={status === "verifying" || status === "verified" || pin.length >= 4}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-xl transition-colors"
        >
          0
        </button>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleSubmit}
          disabled={
            status === "verifying" ||
            status === "verified" ||
            pin.length < 4 ||
            status === "failed"
          }
          className={cn(
            "w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2",
            status === "verified"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white"
          )}
        >
          {status === "verifying" && <Loader className="w-4 h-4 animate-spin" />}
          {status === "verifying" ? "Verifying..." : "Confirm PIN"}
        </button>

        <button
          onClick={handleCancel}
          disabled={status === "verifying" || status === "verified"}
          className="w-full py-3 rounded-lg font-bold bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Timer & Attempts */}
      <div className="mt-6 text-center text-sm text-slate-400 space-y-1">
        <p>
          Attempts remaining:{" "}
          <span className={attempts >= maxAttempts - 1 ? "text-red-400 font-bold" : ""}>
            {maxAttempts - attempts}
          </span>
        </p>
        <p>
          Time remaining:{" "}
          <span className={timeRemaining < 60 ? "text-yellow-400 font-bold" : ""}>
            {formatTime(timeRemaining)}
          </span>
        </p>
      </div>
    </div>
  );
}
