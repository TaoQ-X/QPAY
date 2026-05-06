import React, { useState } from "react";
import Header from "@/components/Header";
import { PINpadDevice } from "@/components/PINpadDevice";
import { ThreeDSecure } from "@/components/ThreeDSecure";
import { ContactlessReader } from "@/components/ContactlessReader";
import { SmartCardReader } from "@/components/SmartCardReader";
import {
  CreditCard,
  Smartphone,
  Wifi,
  Lock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionState {
  id?: string;
  amount: number;
  paymentMethod: "emv" | "contactless" | "online" | null;
  status: "idle" | "processing" | "awaiting_input" | "approved" | "declined";
  cardData?: any;
  transactionId?: string;
}

export default function PaymentTerminal() {
  const [transaction, setTransaction] = useState<TransactionState>({
    amount: 0,
    paymentMethod: null,
    status: "idle",
  });

  const [paymentMethod, setPaymentMethod] = useState<
    "emv" | "contactless" | "online" | null
  >(null);
  const [amount, setAmount] = useState("");
  const [pinSessionId, setPinSessionId] = useState<string | null>(null);
  const [threeDsChallengeId, setThreeDsChallengeId] = useState<string | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setTransaction({
      amount: parseFloat(amount),
      paymentMethod: null,
      status: "awaiting_input",
    });
  };

  const handleEMVPayment = () => {
    setPaymentMethod("emv");
    setTransaction((prev) => ({
      ...prev,
      paymentMethod: "emv",
      status: "processing",
    }));
  };

  const handleContactlessPayment = () => {
    setPaymentMethod("contactless");
    setTransaction((prev) => ({
      ...prev,
      paymentMethod: "contactless",
      status: "processing",
    }));
  };

  const handleOnlinePayment = () => {
    setPaymentMethod("online");
    setTransaction((prev) => ({
      ...prev,
      paymentMethod: "online",
      status: "processing",
    }));
  };

  const handleCardRead = async (cardData: any) => {
    try {
      // Tokenize card
      const tokenResponse = await fetch("/api/payments/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardData }),
      });

      const tokenData = await tokenResponse.json();

      // Process EMV transaction
      const emvResponse = await fetch("/api/payments/emv/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminalId: "TERM_001",
          merchantId: "merchant_001",
          cardData: {
            ...cardData,
            emvChip: {
              applicationId: "A0000000031010",
              terminalVerificationResults: "0000008000",
              cryptogramType: "tc",
            },
          },
          amount: transaction.amount,
          currency: "USD",
        }),
      });

      const emvData = await emvResponse.json();

      if (emvData.status === "pending" && emvData.verification.threedsecureVerified === false) {
        // Requires 3D Secure
        setThreeDsChallengeId(emvData.id);
      } else if (emvData.verification.pinVerified === false && transaction.amount > 100) {
        // Requires PIN
        const sessionResponse = await fetch("/api/payments/pinpad/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: emvData.id,
            terminalId: "TERM_001",
            merchantId: "merchant_001",
          }),
        });

        const sessionData = await sessionResponse.json();
        setPinSessionId(sessionData.sessionId);
      } else {
        // Approved
        handleTransactionComplete(emvData, true);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      handleTransactionComplete(null, false);
    }
  };

  const handleContactlessDetected = async (nfcData: string, amount: number) => {
    try {
      const response = await fetch("/api/payments/contactless/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminalId: "TERM_001",
          merchantId: "merchant_001",
          nfcData,
          amount,
          currency: "USD",
        }),
      });

      const data = await response.json();

      if (data.verification.pinVerified === false && amount > 100) {
        // Requires PIN for large contactless
        const sessionResponse = await fetch("/api/payments/pinpad/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: data.id,
            terminalId: "TERM_001",
            merchantId: "merchant_001",
          }),
        });

        const sessionData = await sessionResponse.json();
        setPinSessionId(sessionData.sessionId);
      } else {
        handleTransactionComplete(data, true);
      }
    } catch (error) {
      console.error("Error processing contactless payment:", error);
      handleTransactionComplete(null, false);
    }
  };

  const handlePINComplete = (verified: boolean) => {
    if (verified) {
      setTransaction((prev) => ({
        ...prev,
        status: "approved",
      }));
      setPinSessionId(null);
    } else {
      handleTransactionComplete(null, false);
    }
  };

  const handle3DSComplete = (success: boolean) => {
    if (success) {
      handleTransactionComplete(transaction, true);
    } else {
      handleTransactionComplete(null, false);
    }
  };

  const handleTransactionComplete = (data: any, success: boolean) => {
    setTransaction((prev) => ({
      ...prev,
      status: success ? "approved" : "declined",
      transactionId: data?.id,
    }));

    if (success && data) {
      setTransactionHistory((prev) => [
        {
          id: data.id,
          amount: data.amount,
          status: data.status,
          type: paymentMethod,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    }

    // Reset after 3 seconds
    setTimeout(() => {
      resetTransaction();
    }, 3000);
  };

  const resetTransaction = () => {
    setTransaction({
      amount: 0,
      paymentMethod: null,
      status: "idle",
    });
    setPaymentMethod(null);
    setAmount("");
    setPinSessionId(null);
    setThreeDsChallengeId(null);
  };

  if (pinSessionId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <PINpadDevice
              sessionId={pinSessionId}
              transactionId={transaction.transactionId || ""}
              amount={transaction.amount}
              onComplete={handlePINComplete}
              onCancel={resetTransaction}
            />
          </div>
        </div>
      </div>
    );
  }

  if (threeDsChallengeId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <ThreeDSecure
              transactionId={transaction.transactionId || ""}
              challengeId={threeDsChallengeId}
              amount={transaction.amount}
              cardLast4="4242"
              cardBrand="visa"
              onComplete={handle3DSComplete}
              onCancel={resetTransaction}
            />
          </div>
        </div>
      </div>
    );
  }

  if (paymentMethod === "emv") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <SmartCardReader
              terminalId="TERM_001"
              onCardRead={handleCardRead}
              onCancel={resetTransaction}
            />
          </div>
        </div>
      </div>
    );
  }

  if (paymentMethod === "contactless") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <ContactlessReader
              terminalId="TERM_001"
              merchantId="merchant_001"
              onPaymentDetected={handleContactlessDetected}
              onCancel={resetTransaction}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />

      <div className="pt-20 pb-8">
        {/* Main Terminal Interface */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Payment Entry Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-8 h-8" />
                    <h1 className="text-3xl font-bold">Payment Terminal</h1>
                  </div>
                  <p className="text-blue-100">Enterprise Payment Processing System</p>
                </div>

                <div className="p-8 space-y-6">
                  {/* Amount Entry */}
                  {transaction.status === "idle" && (
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-700">
                        Enter Transaction Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-4 text-2xl font-bold text-gray-400">
                          $
                        </span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full pl-12 pr-4 py-4 text-3xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <button
                        onClick={handleAmountSubmit}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className="w-full py-4 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg transition-colors"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  )}

                  {/* Payment Method Selection */}
                  {transaction.status === "awaiting_input" && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">
                        Select Payment Method
                      </h2>

                      {/* Transaction Info */}
                      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-1">Amount to Process</p>
                        <p className="text-3xl font-bold text-blue-700">
                          ${transaction.amount.toFixed(2)}
                        </p>
                      </div>

                      {/* Payment Method Buttons */}
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={handleEMVPayment}
                          className="flex items-center justify-center gap-3 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <CreditCard className="w-6 h-6 text-blue-600" />
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Insert EMV Card</p>
                            <p className="text-sm text-gray-600">Chip payment</p>
                          </div>
                        </button>

                        <button
                          onClick={handleContactlessPayment}
                          className="flex items-center justify-center gap-3 p-4 border-2 border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all"
                        >
                          <Wifi className="w-6 h-6 text-green-600" />
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Contactless/NFC</p>
                            <p className="text-sm text-gray-600">Tap phone or card</p>
                          </div>
                        </button>

                        <button
                          onClick={handleOnlinePayment}
                          className="flex items-center justify-center gap-3 p-4 border-2 border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-all"
                        >
                          <Lock className="w-6 h-6 text-purple-600" />
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Online Payment</p>
                            <p className="text-sm text-gray-600">3D Secure authentication</p>
                          </div>
                        </button>
                      </div>

                      <button
                        onClick={resetTransaction}
                        className="w-full py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Processing Status */}
                  {transaction.status === "processing" && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                      <p className="text-lg font-semibold text-gray-900">Processing...</p>
                    </div>
                  )}

                  {/* Transaction Result */}
                  {transaction.status === "approved" && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                      <h2 className="text-2xl font-bold text-green-600 mb-2">
                        Transaction Approved
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Amount: ${transaction.amount.toFixed(2)}
                      </p>
                      <button
                        onClick={resetTransaction}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        New Transaction
                      </button>
                    </div>
                  )}

                  {transaction.status === "declined" && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
                      <h2 className="text-2xl font-bold text-red-600 mb-2">
                        Transaction Declined
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Payment could not be processed
                      </p>
                      <button
                        onClick={resetTransaction}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction History Panel */}
            <div>
              <div className="bg-white rounded-2xl shadow-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>

                {transactionHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactionHistory.map((tx) => (
                      <div
                        key={tx.id}
                        className={cn(
                          "p-3 rounded-lg",
                          tx.status === "approved"
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-900">
                            ${tx.amount.toFixed(2)}
                          </p>
                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-1 rounded",
                              tx.status === "approved"
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                            )}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {tx.type === "emv" && "EMV Card"}
                          {tx.type === "contactless" && "Contactless"}
                          {tx.type === "online" && "Online"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="mt-8 grid lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white border border-white/20">
              <p className="text-xs opacity-75 mb-1">Terminal</p>
              <p className="font-mono font-bold">TERM_001</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white border border-white/20">
              <p className="text-xs opacity-75 mb-1">Merchant</p>
              <p className="font-mono font-bold">merchant_001</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white border border-white/20">
              <p className="text-xs opacity-75 mb-1">EMV Level</p>
              <p className="font-mono font-bold">L2 Certified</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white border border-white/20">
              <p className="text-xs opacity-75 mb-1">PCI Status</p>
              <p className="font-mono font-bold">Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
