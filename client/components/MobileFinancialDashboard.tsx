import { useState } from "react";
import {
  BarChart3,
  CreditCard,
  FileText,
  Link2,
  TrendingUp,
  Send,
  Settings,
  Bell,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardMetrics {
  total_transactions: number;
  total_revenue_cents: number;
  pending_settlements_cents: number;
  active_payment_links: number;
  payment_methods_on_file: number;
  generated_invoices: number;
}

export default function MobileFinancialDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_transactions: 156,
    total_revenue_cents: 450000,
    pending_settlements_cents: 125000,
    active_payment_links: 12,
    payment_methods_on_file: 34,
    generated_invoices: 89,
  });

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "transactions" | "links" | "invoices" | "methods" | "settings"
  >("overview");
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // const response = await fetch("/api/dashboard/metrics");
      // const data = await response.json();
      // setMetrics(data);
      
      toast.success("Dashboard refreshed!");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to refresh dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Complete mobile financial management platform
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(metrics.total_revenue_cents)}
          </p>
          <p className="text-xs text-green-600 mt-1">from {metrics.total_transactions} payments</p>
        </div>

        {/* Pending Settlements */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Pending Settlement</p>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(metrics.pending_settlements_cents)}
          </p>
          <p className="text-xs text-blue-600 mt-1">next payout in 1 day</p>
        </div>

        {/* Active Payment Links */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Payment Links</p>
            <Link2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {metrics.active_payment_links}
          </p>
          <p className="text-xs text-purple-600 mt-1">active & shareable</p>
        </div>

        {/* Stored Payment Methods */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Saved Cards</p>
            <CreditCard className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-700">
            {metrics.payment_methods_on_file}
          </p>
          <p className="text-xs text-orange-600 mt-1">customers on file</p>
        </div>

        {/* Generated Invoices */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Invoices</p>
            <FileText className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-700">
            {metrics.generated_invoices}
          </p>
          <p className="text-xs text-yellow-600 mt-1">auto-generated</p>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">System Status</p>
            <CheckCircle className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-teal-700">Healthy</p>
          <p className="text-xs text-teal-600 mt-1">all systems operational</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "transactions", label: "Transactions", icon: DollarSign },
            { id: "links", label: "Payment Links", icon: Link2 },
            { id: "invoices", label: "Invoices", icon: FileText },
            { id: "methods", label: "Payment Methods", icon: CreditCard },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() =>
                setSelectedTab(
                  id as
                    | "overview"
                    | "transactions"
                    | "links"
                    | "invoices"
                    | "methods"
                    | "settings"
                )
              }
              className={`flex-1 min-w-max px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-all ${
                selectedTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button className="p-4 border border-border rounded-lg hover:bg-muted transition-all text-left">
                    <Send className="w-5 h-5 text-primary mb-2" />
                    <p className="font-medium text-foreground">Create Payment Link</p>
                    <p className="text-xs text-muted-foreground">Send to customers</p>
                  </button>

                  <button className="p-4 border border-border rounded-lg hover:bg-muted transition-all text-left">
                    <FileText className="w-5 h-5 text-primary mb-2" />
                    <p className="font-medium text-foreground">Generate Invoice</p>
                    <p className="text-xs text-muted-foreground">Auto-number & send</p>
                  </button>

                  <button className="p-4 border border-border rounded-lg hover:bg-muted transition-all text-left">
                    <CreditCard className="w-5 h-5 text-primary mb-2" />
                    <p className="font-medium text-foreground">Manage Cards</p>
                    <p className="text-xs text-muted-foreground">Update payment methods</p>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    {
                      type: "payment",
                      description: "Payment received from John Doe",
                      amount: "$500.00",
                      time: "2 hours ago",
                      icon: CheckCircle,
                      color: "text-green-600",
                    },
                    {
                      type: "invoice",
                      description: "Invoice INV-000087 generated",
                      amount: "$350.00",
                      time: "4 hours ago",
                      icon: FileText,
                      color: "text-blue-600",
                    },
                    {
                      type: "link",
                      description: "Payment link clicked 5 times",
                      amount: "Service Payment",
                      time: "6 hours ago",
                      icon: Link2,
                      color: "text-purple-600",
                    },
                  ].map((activity, idx) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${activity.color}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {activity.amount}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {selectedTab === "transactions" && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Transaction History</h3>
              <p className="text-muted-foreground">
                View all transactions, apply filters, and export data
              </p>
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all">
                View Full History
              </button>
            </div>
          )}

          {selectedTab === "links" && (
            <div className="text-center py-12">
              <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Payment Links</h3>
              <p className="text-muted-foreground">
                Create shareable payment links with custom amounts and branding
              </p>
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all">
                Manage Payment Links
              </button>
            </div>
          )}

          {selectedTab === "invoices" && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Invoice Management</h3>
              <p className="text-muted-foreground">
                Auto-generate invoices with proper numbering and send via email/SMS
              </p>
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all">
                Manage Invoices
              </button>
            </div>
          )}

          {selectedTab === "methods" && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Payment Methods</h3>
              <p className="text-muted-foreground">
                Manage stored customer cards and automatic card update events
              </p>
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all">
                Manage Payment Methods
              </button>
            </div>
          )}

          {selectedTab === "settings" && (
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Notifications</h4>
                <div className="space-y-2">
                  {[
                    "Payment received alerts",
                    "Settlement notifications",
                    "Invoice generation confirmations",
                  ].map((setting, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded transition-all cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground">{setting}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Advanced Settings</h4>
                <button className="text-sm text-primary hover:underline">
                  Configure API Keys
                </button>
                <br />
                <button className="text-sm text-primary hover:underline mt-2">
                  Set Webhook Endpoints
                </button>
                <br />
                <button className="text-sm text-primary hover:underline mt-2">
                  Configure Settlement Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
