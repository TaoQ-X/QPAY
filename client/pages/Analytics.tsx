import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  CreditCard,
  Shield,
  Download,
  Filter,
  Calendar,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
  icon: React.ReactNode;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState("30days");
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const metrics: AnalyticsMetric[] = [
    {
      label: "Total Revenue",
      value: "$2,847,592",
      change: 12.5,
      trend: "up",
      icon: <TrendingUp className="w-6 h-6 text-accent" />,
    },
    {
      label: "Total Transactions",
      value: "14,582",
      change: 8.2,
      trend: "up",
      icon: <CreditCard className="w-6 h-6 text-primary" />,
    },
    {
      label: "Success Rate",
      value: "98.7%",
      change: 0.3,
      trend: "up",
      icon: <Shield className="w-6 h-6 text-secondary" />,
    },
    {
      label: "Fraud Detected",
      value: "47",
      change: -15.2,
      trend: "down",
      icon: <AlertTriangle className="w-6 h-6 text-destructive" />,
    },
  ];

  const paymentMethods = [
    { name: "Apple Pay", percentage: 35, amount: "$997,914", count: 5103 },
    { name: "Credit Card", percentage: 28, amount: "$797,726", count: 4083 },
    { name: "Google Pay", percentage: 22, amount: "$626,070", count: 3208 },
    { name: "Cryptocurrency", percentage: 15, amount: "$425,639", count: 2188 },
  ];

  const topBlockchains = [
    { name: "Ethereum", transactions: 4250, volume: "$850,000", fee: "1.8%" },
    { name: "Polygon", transactions: 3890, volume: "$778,000", fee: "0.5%" },
    { name: "Bitcoin", transactions: 2150, volume: "$430,000", fee: "2.1%" },
    { name: "Solana", transactions: 1895, volume: "$379,000", fee: "0.3%" },
  ];

  const fraudAlerts = [
    {
      id: 1,
      type: "High Frequency",
      severity: "warning",
      message: "Unusual transaction velocity detected",
      timestamp: "2 hours ago",
      actionTaken: "Flagged for review",
    },
    {
      id: 2,
      type: "Geographic",
      severity: "critical",
      message: "Impossible location travel detected",
      timestamp: "4 hours ago",
      actionTaken: "Transaction blocked",
    },
    {
      id: 3,
      type: "Amount Anomaly",
      severity: "warning",
      message: "Transaction 5x above average detected",
      timestamp: "6 hours ago",
      actionTaken: "Manual review requested",
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In real app, would generate CSV/PDF report
      const report = `Q Pay Analytics Report - ${new Date().toLocaleDateString()}
Revenue: $2,847,592
Transactions: 14,582
Success Rate: 98.7%
Fraud Detected: 47`;
      
      const element = document.createElement("a");
      element.href = "data:text/plain;charset=utf-8," + encodeURIComponent(report);
      element.download = `qpay-analytics-${new Date().toISOString().split('T')[0]}.txt`;
      element.click();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-white">
      <Header />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Analytics & Reports</h1>
              <p className="text-muted-foreground">Real-time insights into your payment operations</p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {isExporting ? "Exporting..." : "Export Report"}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-4 py-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border-none outline-none bg-white text-foreground text-sm"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="1year">Last year</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-4 py-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border-none outline-none bg-white text-foreground text-sm"
              >
                <option value="all">All Metrics</option>
                <option value="revenue">Revenue</option>
                <option value="transactions">Transactions</option>
                <option value="fraud">Fraud Alerts</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-border p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {metric.icon}
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                      metric.trend === "up"
                        ? "bg-accent/10 text-accent"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {metric.trend === "up" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-2">{metric.label}</p>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Payment Methods & Blockchains */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Payment Methods */}
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Payment Methods</h2>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{method.name}</span>
                      <span className="text-sm text-muted-foreground">{method.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{method.amount}</span>
                      <span>{method.count.toLocaleString()} txns</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Blockchains */}
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-secondary" />
                <h2 className="text-lg font-semibold text-foreground">Top Blockchains</h2>
              </div>

              <div className="space-y-4">
                {topBlockchains.map((chain, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{chain.name}</p>
                      <p className="text-xs text-muted-foreground">{chain.transactions.toLocaleString()} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{chain.volume}</p>
                      <p className="text-xs text-muted-foreground">Fee: {chain.fee}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fraud Alerts */}
          <div className="bg-white rounded-xl border border-border p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Recent Fraud Alerts</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Message</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Severity</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Time</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudAlerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-border hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{alert.type}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{alert.message}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.severity === "critical"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{alert.timestamp}</td>
                      <td className="py-3 px-4">
                        <button className="text-primary hover:underline text-xs font-medium">
                          {alert.actionTaken}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Conversion Rate</h3>
              <p className="text-3xl font-bold text-primary mb-2">4.2%</p>
              <p className="text-sm text-muted-foreground">↑ 0.8% from last period</p>
            </div>

            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Avg Transaction Value</h3>
              <p className="text-3xl font-bold text-secondary mb-2">$195.23</p>
              <p className="text-sm text-muted-foreground">↑ 5.2% from last period</p>
            </div>

            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Chargeback Rate</h3>
              <p className="text-3xl font-bold text-accent mb-2">0.12%</p>
              <p className="text-sm text-muted-foreground">↓ 0.05% from last period</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
