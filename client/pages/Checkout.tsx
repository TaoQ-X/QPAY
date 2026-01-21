import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { 
  ShoppingCart, 
  ArrowLeft,
  CreditCard,
  Smartphone,
  DollarSign,
  Zap,
  Cpu,
  Shield,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";

interface CheckoutItem {
  id: string;
  name: string;
  amount: number;
  quantity: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"cart" | "payment" | "confirm" | "success">("cart");
  const [selectedPayment, setSelectedPayment] = useState<"apple" | "google" | "card" | "crypto">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  const [cartItems] = useState<CheckoutItem[]>([
    { id: "1", name: "Premium API Access", amount: 99.99, quantity: 1 },
    { id: "2", name: "White-label Solution", amount: 499.99, quantity: 1 },
  ]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);
  const tax = subtotal * 0.08;
  const processingFee = subtotal * 0.029;
  const total = subtotal + tax + processingFee;

  const paymentMethods = [
    {
      id: "apple",
      name: "Apple Pay",
      icon: "🍎",
      description: "Fastest & Safest",
      supported: true,
      fee: "1.8%",
    },
    {
      id: "google",
      name: "Google Pay",
      icon: "📱",
      description: "One-Tap Payment",
      supported: true,
      fee: "1.8%",
    },
    {
      id: "card",
      name: "Credit Card",
      icon: "💳",
      description: "Visa, MC, Amex",
      supported: true,
      fee: "2.5%",
    },
    {
      id: "crypto",
      name: "Cryptocurrency",
      icon: "₿",
      description: "Direct Blockchain",
      supported: true,
      fee: "0.5%",
    },
  ];

  const handlePayment = async () => {
    setError("");
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate order ID
      const generatedOrderId = `ORDER-${Date.now()}`;
      setOrderId(generatedOrderId);

      // Move to success
      setStep("success");
    } catch (err) {
      setError("Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-white">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 ${step === "cart" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step === "cart" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  1
                </div>
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
              </div>
              <div className={`h-1 flex-1 mx-2 ${step !== "cart" ? "bg-primary" : "bg-muted"}`}></div>
              <div className={`flex items-center gap-2 ${step === "payment" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step === "payment" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  2
                </div>
                <span className="hidden sm:inline text-sm font-medium">Payment</span>
              </div>
              <div className={`h-1 flex-1 mx-2 ${step === "success" ? "bg-primary" : "bg-muted"}`}></div>
              <div className={`flex items-center gap-2 ${step === "success" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step === "success" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  3
                </div>
                <span className="hidden sm:inline text-sm font-medium">Done</span>
              </div>
            </div>
          </div>

          {/* Cart Step */}
          {step === "cart" && (
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Your Cart</h2>
              </div>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4 border-b border-border">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-foreground">${(item.amount * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="text-foreground">${tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="text-foreground">${processingFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border font-bold text-lg">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setStep("payment")}
                className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Payment
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Payment Step */}
          {step === "payment" && (
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Payment Method</h2>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id as any)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedPayment === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <p className="font-semibold text-foreground text-sm">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                    <p className="text-xs text-primary font-medium mt-1">{method.fee}</p>
                  </button>
                ))}
              </div>

              {/* Security Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm mb-1">Secure Checkout</p>
                  <p className="text-xs text-blue-800">Your payment is processed with bank-level encryption</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-muted/30 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-foreground">${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-semibold text-foreground">USD</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-semibold text-foreground capitalize">{selectedPayment}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Complete Purchase
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep("cart")}
                  className="w-full border border-border text-foreground py-3 rounded-lg font-semibold hover:bg-muted transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Cart
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="bg-white rounded-xl border border-border p-6 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-accent" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">Your transaction has been completed securely</p>

              <div className="bg-muted/30 rounded-lg p-6 mb-6 text-left space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono font-semibold text-foreground">{orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-xl font-bold text-primary">${total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-semibold text-foreground capitalize">{selectedPayment} Pay</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full border border-border text-foreground py-3 rounded-lg font-semibold hover:bg-muted transition-all"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
