import React, { useState, useEffect } from "react";
import { Wifi, AlertCircle, CheckCircle, Loader, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactlessReaderProps {
  terminalId: string;
  merchantId: string;
  onPaymentDetected: (nfcData: string, amount: number) => void;
  onCancel: () => void;
}

export function ContactlessReader({
  terminalId,
  merchantId,
  onPaymentDetected,
  onCancel,
}: ContactlessReaderProps) {
  const [status, setStatus] = useState<
    "waiting" | "reading" | "detected" | "processing" | "approved" | "declined" | "timeout"
  >("waiting");
  const [cardDetected, setCardDetected] = useState(false);
  const [cardData, setCardData] = useState<{
    cardType: string;
    lastFour: string;
    cardBrand: string;
  } | null>(null);
  const [amount, setAmount] = useState("50.00");
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes
  const [nfcSupported, setNfcSupported] = useState(true);

  // Check NFC support
  useEffect(() => {
    if ("NDEFReader" in window) {
      setNfcSupported(true);
    } else {
      setNfcSupported(false);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (status === "approved" || status === "declined") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStatus("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Simulate NFC card detection
  useEffect(() => {
    if (status !== "waiting") return;

    const timer = setTimeout(() => {
      // Simulate card detection after 2 seconds
      const random = Math.random();
      if (random > 0.2) {
        setCardDetected(true);
        setCardData({
          cardType: "Contactless",
          lastFour: "4242",
          cardBrand: "Visa",
        });
        setStatus("detected");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [status]);

  const handleStartReading = () => {
    setStatus("reading");

    // Simulate NFC reading
    setTimeout(() => {
      onPaymentDetected(
        "NFC_DATA_SIGNATURE_" + Date.now(),
        parseFloat(amount)
      );
      setStatus("processing");
    }, 1500);
  };

  const handleApprove = () => {
    setStatus("approved");
    setTimeout(() => onCancel(), 2000);
  };

  const handleDecline = () => {
    setStatus("declined");
    setTimeout(() => {
      setStatus("waiting");
      setCardDetected(false);
      setCardData(null);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!nfcSupported) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 text-gray-900 max-w-md mx-auto shadow-lg border border-amber-200">
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">NFC Not Supported</h2>
          <p className="text-sm text-gray-600">
            This device does not support contactless NFC payments. Please use an
            alternative payment method.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 text-gray-900 max-w-md mx-auto shadow-lg border border-cyan-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Wifi className="w-6 h-6 text-cyan-600 animate-pulse" />
        <h2 className="text-2xl font-bold">Contactless Payment</h2>
      </div>

      {/* Status Messages */}
      {status === "timeout" && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Session Timeout</p>
            <p className="text-sm text-red-700">No card detected within time limit</p>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Payment Approved</p>
            <p className="text-sm text-green-700">Transaction completed successfully</p>
          </div>
        </div>
      )}

      {status === "declined" && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Payment Declined</p>
            <p className="text-sm text-red-700">Please try another card</p>
          </div>
        </div>
      )}

      {/* Terminal Status */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Terminal</p>
        <p className="font-mono text-sm font-semibold">{terminalId}</p>
      </div>

      {/* Amount Input */}
      {status === "waiting" && (
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Transaction Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-lg font-bold text-gray-600">
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg font-bold"
            />
          </div>
        </div>
      )}

      {/* Card Detection Animation */}
      {status === "waiting" && !cardDetected && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-12 border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center">
            <Smartphone className="w-12 h-12 text-cyan-600 mb-4 animate-bounce" />
            <p className="text-center font-semibold text-gray-700">
              Hold card or phone near the reader
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Waiting for contactless card...
            </p>
          </div>
        </div>
      )}

      {/* Card Detected */}
      {cardDetected && cardData && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl p-6 text-white shadow-lg">
            <p className="text-xs opacity-80 mb-2">Card Detected</p>
            <p className="text-2xl font-bold mb-4">
              {cardData.cardBrand} •••• {cardData.lastFour}
            </p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-80">Amount</p>
                <p className="text-xl font-bold">${amount}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Type</p>
                <p className="text-sm font-semibold">{cardData.cardType}</p>
              </div>
            </div>
          </div>

          {status === "detected" && (
            <div className="space-y-3">
              <button
                onClick={handleStartReading}
                className="w-full py-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Complete Payment
              </button>
              <button
                onClick={handleDecline}
                className="w-full py-3 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Decline
              </button>
            </div>
          )}

          {status === "reading" && (
            <div className="flex flex-col items-center py-6">
              <Loader className="w-8 h-8 text-cyan-600 animate-spin mb-4" />
              <p className="text-sm font-semibold text-gray-700">Reading card data...</p>
            </div>
          )}

          {status === "processing" && (
            <div className="flex flex-col items-center py-6">
              <Loader className="w-8 h-8 text-cyan-600 animate-spin mb-4" />
              <p className="text-sm font-semibold text-gray-700">
                Processing payment...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Alternative Actions */}
      {status === "waiting" && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="w-full py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Use Different Payment Method
          </button>
        </div>
      )}

      {/* Timer */}
      {(status === "waiting" || status === "detected" || status === "reading" || status === "processing") && (
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Time remaining:{" "}
            <span className={timeRemaining < 30 ? "text-red-600 font-bold" : ""}>
              {formatTime(timeRemaining)}
            </span>
          </p>
        </div>
      )}

      {/* Security Info */}
      {status === "waiting" && (
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            ✓ Payments are PCI-DSS compliant and EMV certified
          </p>
        </div>
      )}
    </div>
  );
}
