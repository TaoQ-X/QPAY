import { useState } from "react";
import {
  CreditCard,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  card_brand: string;
  card_last_four: string;
  card_expiry_month: number;
  card_expiry_year: number;
  is_primary: boolean;
  status: "active" | "expired" | "invalid" | "archived";
  created_at: string;
}

interface CardUpdaterEvent {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
  new_expiry_month?: number;
  new_expiry_year?: number;
}

export default function CustomerPaymentMethodsManager() {
  const [customerId, setCustomerId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [updaterHistory, setUpdaterHistory] = useState<CardUpdaterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_identifier: "",
    card_token: "",
    card_brand: "visa",
    card_last_four: "",
    card_expiry_month: new Date().getMonth() + 1,
    card_expiry_year: new Date().getFullYear(),
    is_primary: false,
  });

  const fetchPaymentMethods = async () => {
    if (!customerId) {
      toast.error("Please enter a customer ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/payment-methods`);

      if (!response.ok) throw new Error("Failed to fetch payment methods");

      const result = await response.json();

      if (result.success) {
        setPaymentMethods(result.data);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/customers/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          customer_identifier: customerId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add payment method");

      const result = await response.json();

      if (result.success) {
        setPaymentMethods([...paymentMethods, result.data]);
        setShowAddMethod(false);
        setFormData({
          customer_identifier: "",
          card_token: "",
          card_brand: "visa",
          card_last_four: "",
          card_expiry_month: new Date().getMonth() + 1,
          card_expiry_year: new Date().getFullYear(),
          is_primary: false,
        });
        toast.success("Payment method added successfully!");
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast.error("Failed to add payment method");
    } finally {
      setLoading(false);
    }
  };

  const setPrimaryMethod = async (methodId: string) => {
    try {
      // First, unset all
      setPaymentMethods(
        paymentMethods.map((m) => ({ ...m, is_primary: false }))
      );

      // Then set the selected one
      setPaymentMethods(
        paymentMethods.map((m) =>
          m.id === methodId ? { ...m, is_primary: true } : m
        )
      );

      toast.success("Primary payment method updated!");
    } catch (error) {
      console.error("Error setting primary method:", error);
      toast.error("Failed to update primary method");
    }
  };

  const removePaymentMethod = async (methodId: string) => {
    try {
      const response = await fetch(`/api/customers/payment-methods/${methodId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete payment method");

      setPaymentMethods(paymentMethods.filter((m) => m.id !== methodId));
      toast.success("Payment method removed");
    } catch (error) {
      console.error("Error removing payment method:", error);
      toast.error("Failed to remove payment method");
    }
  };

  const viewUpdaterHistory = async (methodId: string) => {
    try {
      const response = await fetch(
        `/api/customers/payment-methods/${methodId}/updater-history`
      );

      if (!response.ok) throw new Error("Failed to fetch updater history");

      const result = await response.json();

      if (result.success) {
        setUpdaterHistory(result.data);
        setSelectedMethodId(methodId);
      }
    } catch (error) {
      console.error("Error fetching updater history:", error);
      toast.error("Failed to load updater history");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "expired":
        return "bg-yellow-100 text-yellow-700";
      case "invalid":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "expired":
      case "invalid":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getBrandIcon = (brand: string) => {
    const icons: { [key: string]: string } = {
      visa: "💳",
      mastercard: "💳",
      amex: "💳",
      discover: "💳",
    };
    return icons[brand.toLowerCase()] || "💳";
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Customer Payment Methods
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter customer ID..."
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={fetchPaymentMethods}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load Methods"}
          </button>
        </div>
      </div>

      {customerId && (
        <>
          {/* Add Method Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">
              Payment Methods for {customerId}
            </h3>
            <button
              onClick={() => setShowAddMethod(!showAddMethod)}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Method
            </button>
          </div>

          {/* Add Method Form */}
          {showAddMethod && (
            <div className="bg-white border border-border rounded-lg p-6">
              <form onSubmit={addPaymentMethod} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Card Token *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="tok_visa_4242"
                      value={formData.card_token}
                      onChange={(e) =>
                        setFormData({ ...formData, card_token: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Card Brand
                    </label>
                    <select
                      value={formData.card_brand}
                      onChange={(e) =>
                        setFormData({ ...formData, card_brand: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="discover">Discover</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last 4 Digits *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4242"
                      value={formData.card_last_four}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          card_last_four: e.target.value.slice(0, 4),
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Expiry Month
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.card_expiry_month}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          card_expiry_month: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Expiry Year
                    </label>
                    <input
                      type="number"
                      min={new Date().getFullYear()}
                      value={formData.card_expiry_year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          card_expiry_year: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        checked={formData.is_primary}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_primary: e.target.checked,
                          })
                        }
                      />
                      Set as Primary
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Payment Method"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMethod(false)}
                    className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Methods List */}
          <div className="grid grid-cols-1 gap-4">
            {paymentMethods.length === 0 ? (
              <div className="bg-white border border-border rounded-lg p-8 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  No payment methods
                </h3>
                <p className="text-muted-foreground">
                  Add a payment method to get started
                </p>
              </div>
            ) : (
              paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">
                        {getBrandIcon(method.card_brand)}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {method.card_brand.toUpperCase()} •••• {method.card_last_four}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expires {method.card_expiry_month}/{method.card_expiry_year}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        method.status
                      )}`}
                    >
                      {getStatusIcon(method.status)}
                      {method.status}
                    </span>
                  </div>

                  {method.is_primary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-700" />
                      <span className="text-sm text-blue-700">
                        Primary payment method
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!method.is_primary && (
                      <button
                        onClick={() => setPrimaryMethod(method.id)}
                        className="flex-1 px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-all text-sm font-medium"
                      >
                        Set as Primary
                      </button>
                    )}

                    <button
                      onClick={() => viewUpdaterHistory(method.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Updater History
                    </button>

                    <button
                      onClick={() => removePaymentMethod(method.id)}
                      className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Updater History Modal */}
          {selectedMethodId && updaterHistory.length > 0 && (
            <div className="bg-white border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Card Updater History
              </h3>

              <div className="space-y-3">
                {updaterHistory.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground capitalize">
                        {event.event_type.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === "processed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedMethodId(null)}
                className="w-full mt-4 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all"
              >
                Close
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
