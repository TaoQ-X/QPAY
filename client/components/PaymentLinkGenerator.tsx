import { useState } from "react";
import { Copy, Link2, Trash2, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";

interface PaymentLink {
  id: string;
  title: string;
  description?: string;
  amount_cents?: number;
  public_url: string;
  created_at: string;
  status: string;
  analytics?: {
    link_clicks: number;
    total_transactions: number;
    completed_transactions: number;
    total_revenue_cents: number;
  };
}

export default function PaymentLinkGenerator() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount_cents: undefined as number | undefined,
    is_variable_amount: false,
    min_amount_cents: undefined as number | undefined,
    max_amount_cents: undefined as number | undefined,
    currency: "USD",
    theme_color: "#3b82f6",
  });

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create payment link");

      const result = await response.json();

      if (result.success) {
        setLinks([result.data, ...links]);
        setFormData({
          title: "",
          description: "",
          amount_cents: undefined,
          is_variable_amount: false,
          min_amount_cents: undefined,
          max_amount_cents: undefined,
          currency: "USD",
          theme_color: "#3b82f6",
        });
        setShowForm(false);
        toast.success("Payment link created successfully!");
      }
    } catch (error) {
      console.error("Error creating payment link:", error);
      toast.error("Failed to create payment link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const deleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-links/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete link");

      setLinks(links.filter((link) => link.id !== id));
      toast.success("Payment link archived");
    } catch (error) {
      console.error("Error deleting payment link:", error);
      toast.error("Failed to delete payment link");
    }
  };

  const formatAmount = (cents?: number) => {
    if (!cents) return "Variable";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payment Links</h2>
          <p className="text-muted-foreground mt-1">
            Create shareable payment links for your customers
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all"
        >
          + New Payment Link
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-lg p-6">
          <form onSubmit={createLink} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Link Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Service Payment"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Amount (cents)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 5000 for $50"
                  value={formData.amount_cents || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount_cents: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  placeholder="What is this payment for?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.is_variable_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, is_variable_amount: e.target.checked })
                    }
                  />
                  Variable Amount
                </label>
              </div>

              {formData.is_variable_amount && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Minimum Amount (cents)
                    </label>
                    <input
                      type="number"
                      value={formData.min_amount_cents || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_amount_cents: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Maximum Amount (cents)
                    </label>
                    <input
                      type="number"
                      value={formData.max_amount_cents || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_amount_cents: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Theme Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) =>
                      setFormData({ ...formData, theme_color: e.target.value })
                    }
                    className="w-12 h-10 border border-border rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.theme_color}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Payment Link"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Links List */}
      <div className="grid grid-cols-1 gap-4">
        {links.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No payment links yet</h3>
            <p className="text-muted-foreground">
              Create your first payment link to start collecting payments
            </p>
          </div>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{link.title}</h3>
                  {link.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {link.description}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {link.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="font-semibold text-foreground">
                    {formatAmount(link.amount_cents)}
                  </p>
                </div>

                {link.analytics && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <BarChart3 className="w-3 h-3" />
                        Clicks
                      </p>
                      <p className="font-semibold text-foreground">
                        {link.analytics.link_clicks}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Transactions
                      </p>
                      <p className="font-semibold text-foreground">
                        {link.analytics.completed_transactions}/
                        {link.analytics.total_transactions}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 bg-muted p-3 rounded-lg mb-4">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <code className="text-sm text-foreground flex-1 truncate">
                  {link.public_url}
                </code>
                <button
                  onClick={() => copyToClipboard(link.public_url)}
                  className="p-2 hover:bg-white rounded transition-all"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4 text-primary" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    window.open(`/p/${link.public_url.split("/").pop()}`, "_blank")
                  }
                  className="flex-1 px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-all text-sm font-medium"
                >
                  Preview
                </button>
                <button
                  onClick={() => deleteLink(link.id)}
                  className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
