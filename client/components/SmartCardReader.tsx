import React, { useState } from "react";
import { CreditCard, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartCardReaderProps {
  terminalId: string;
  onCardRead: (cardData: {
    pan: string;
    expiryDate: string;
    cardholderName: string;
    cardBrand: string;
  }) => void;
  onCancel: () => void;
}

export function SmartCardReader({
  terminalId,
  onCardRead,
  onCancel,
}: SmartCardReaderProps) {
  const [status, setStatus] = useState<
    "waiting" | "reading" | "detected" | "error"
  >("waiting");
  const [cardData, setCardData] = useState<{
    cardBrand: string;
    lastFour: string;
    cardholderName: string;
    expiryDate: string;
  } | null>(null);

  const handleManualEntry = () => {
    setStatus("waiting");
    // Simulate card detection
    setTimeout(() => {
      setStatus("detected");
      const simulatedCard = {
        cardBrand: "Visa",
        lastFour: "4242",
        cardholderName: "JOHN SMITH",
        expiryDate: "12/25",
      };
      setCardData(simulatedCard);
    }, 1500);
  };

  const handleConfirm = () => {
    if (cardData) {
      onCardRead({
        pan: "**** **** **** " + cardData.lastFour,
        expiryDate: cardData.expiryDate,
        cardholderName: cardData.cardholderName,
        cardBrand: cardData.cardBrand,
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-8 text-gray-900 max-w-md mx-auto shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Insert Card</h2>
      </div>

      {/* Status Messages */}
      {status === "error" && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Card Read Error</p>
            <p className="text-sm text-red-700">Unable to read card data</p>
          </div>
        </div>
      )}

      {status === "detected" && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Card Detected</p>
            <p className="text-sm text-green-700">Card data successfully read</p>
          </div>
        </div>
      )}

      {/* Card Reader Animation */}
      <div className="bg-white rounded-lg p-8 mb-6 border-2 border-gray-300 flex flex-col items-center justify-center min-h-48">
        {status === "waiting" && (
          <>
            <div className="relative mb-6">
              <div className="w-32 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-xs font-mono">•••• •••• •••• ••••</div>
                </div>
              </div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-yellow-500 rounded-t-lg"></div>
            </div>
            <p className="text-center font-semibold text-gray-700 mb-2">
              Insert card with chip facing down
            </p>
            <p className="text-center text-sm text-gray-500">
              Reading EMV chip data...
            </p>
          </>
        )}

        {status === "reading" && (
          <>
            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-center font-semibold text-gray-700">
              Reading card...
            </p>
          </>
        )}

        {status === "detected" && cardData && (
          <>
            <CreditCard className="w-12 h-12 text-green-600 mb-4" />
            <div className="space-y-3 w-full">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Brand</p>
                <p className="font-semibold">{cardData.cardBrand}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Card Number</p>
                <p className="font-mono">•••• •••• •••• {cardData.lastFour}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Cardholder</p>
                <p className="font-semibold">{cardData.cardholderName}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Expires</p>
                <p className="font-semibold">{cardData.expiryDate}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {status === "detected" && (
          <>
            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              Confirm & Continue
            </button>
            <button
              onClick={() => {
                setStatus("waiting");
                setCardData(null);
              }}
              className="w-full py-3 rounded-lg font-bold bg-gray-300 hover:bg-gray-400 text-gray-900 transition-colors"
            >
              Read Another Card
            </button>
          </>
        )}

        {status === "waiting" && (
          <>
            <button
              onClick={handleManualEntry}
              className="w-full py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Simulate Card Read
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-lg font-bold bg-gray-300 hover:bg-gray-400 text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Security Info */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 font-semibold mb-1">
          ✓ EMV Level 2 Certified
        </p>
        <p className="text-xs text-blue-700">
          All card data is encrypted and tokenized for PCI-DSS compliance
        </p>
      </div>

      {/* Terminal Info */}
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Terminal: {terminalId}</p>
      </div>
    </div>
  );
}
