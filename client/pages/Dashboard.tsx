import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  AlertCircle,
  Settings,
  LogOut,
  Download,
} from "lucide-react";

interface AnalyticsData {
  total_revenue: number;
  total_transactions: number;
  active_customers: number;
  kyc_status: string;
  next_settlement: string;
  monthly_volume_remaining?: number;
}

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Fetch analytics on component mount
    // If backend is unavailable, fallback to mock data happens in catch block
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/business/demo_biz_001/analytics");

      if (!response.ok) {
        console.warn(`Analytics request failed with status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response text first for safer parsing
      const responseText = await response.text();

      if (!responseText) {
        throw new Error("Empty response from analytics endpoint");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse analytics response:", parseError, "Response:", responseText);
        throw new Error("Invalid JSON response from analytics endpoint");
      }

      if (data.success && data.data) {
        setAnalyticsData(data.data);
      } else {
        console.warn("Invalid analytics response structure:", data);
        // Use mock data if API response is invalid
        setAnalyticsData({
          total_revenue: 150000,
          total_transactions: 42,
          active_customers: 28,
          kyc_status: "verified",
          next_settlement: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          monthly_volume_remaining: 500000,
        });
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      // Use mock data as fallback when API is unavailable
      setAnalyticsData({
        total_revenue: 150000,
        total_transactions: 42,
        active_customers: 28,
        kyc_status: "verified",
        next_settlement: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        monthly_volume_remaining: 500000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome to your Q Pay business dashboard
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-white rounded-lg transition-all">
                <Settings className="w-6 h-6 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-white rounded-lg transition-all">
                <LogOut className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* KYC Status Alert */}
          {analyticsData?.kyc_status !== "verified" && (
            <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">
                  KYC Verification Pending
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your account is pending KYC verification. This typically takes 24-48 hours.
                  Once verified, you'll have access to all features.
                </p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-8 flex gap-1 border-b border-border">
            {["overview", "transactions", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium border-b-2 transition-all capitalize ${
                  activeTab === tab
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </p>
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  {loading ? (
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        ${(analyticsData?.total_revenue || 0) / 100}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last 30 days
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Transactions
                    </p>
                    <CreditCard className="w-5 h-5 text-secondary" />
                  </div>
                  {loading ? (
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {analyticsData?.total_transactions || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Total completed
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Active Customers
                    </p>
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  {loading ? (
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {analyticsData?.active_customers || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        This month
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-border rounded-lg p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Next Settlement
                    </p>
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  {loading ? (
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {analyticsData?.next_settlement
                          ? new Date(
                              analyticsData.next_settlement
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Scheduled settlement
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all text-sm font-medium">
                      Generate API Key
                    </button>
                    <button className="w-full px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all text-sm font-medium">
                      View Documentation
                    </button>
                    <button className="w-full px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all text-sm font-medium flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Report
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    Integration
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Your API Key (hidden for security)
                    </p>
                    <input
                      type="password"
                      value="sk_live_xxxxxxxxxxxxxxxxxxxx"
                      readOnly
                      className="w-full px-3 py-2 bg-muted border border-border rounded text-sm font-mono"
                    />
                    <button className="text-sm text-primary hover:underline">
                      Show API Key
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    Support
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <span className="font-semibold text-accent">● Operational</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Support:</span>{" "}
                      <span className="font-semibold">24/7 Available</span>
                    </p>
                    <button className="text-primary hover:underline">
                      Contact Support →
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-6">
                  Recent Transactions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                          Hash
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          date: "Jan 17, 2024",
                          amount: "$5,000",
                          status: "completed",
                          hash: "0x1234567890ab",
                        },
                        {
                          date: "Jan 16, 2024",
                          amount: "$3,000",
                          status: "completed",
                          hash: "0xfedcba0987654",
                        },
                        {
                          date: "Jan 15, 2024",
                          amount: "$8,000",
                          status: "completed",
                          hash: "0xabcdef123456",
                        },
                      ].map((txn, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border hover:bg-muted/50"
                        >
                          <td className="py-3 px-4 text-foreground">{txn.date}</td>
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {txn.amount}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                              {txn.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                            {txn.hash}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div className="bg-white border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-6">
                All Transactions
              </h3>
              <p className="text-muted-foreground">
                Transaction details and filtering coming soon...
              </p>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white border border-border rounded-lg p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">
                      Account Settings
                    </h3>
                    <button className="text-primary hover:underline">
                      Edit Profile
                    </button>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="font-semibold text-foreground mb-4">
                      API Configuration
                    </h3>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Manage your API keys and webhooks
                      </p>
                      <button className="text-primary hover:underline">
                        View API Settings
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="font-semibold text-foreground mb-4">
                      Settlement Preferences
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Settlement Frequency
                        </p>
                        <p className="font-semibold text-foreground">Daily</p>
                      </div>
                      <button className="text-primary hover:underline">
                        Change Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Plan Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Plan</p>
                    <p className="font-semibold text-foreground">Starter</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      Monthly Volume Remaining
                    </p>
                    <p className="font-semibold text-foreground">
                      ${(analyticsData?.monthly_volume_remaining || 0) / 100}
                    </p>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all">
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
