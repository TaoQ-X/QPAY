import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { TerminalAlertManager } from "@/components/TerminalAlertManager";
import { DigitalInvoice } from "@/components/DigitalInvoice";
import {
  BarChart3,
  Activity,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Download,
  Search,
  RefreshCw,
  Eye,
  MapPin,
  DollarSign,
  Clock,
  Bell,
  FileText,
} from "lucide-react";

interface Transaction {
  id: string;
  terminalId: string;
  amount: number;
  currency: string;
  status: "approved" | "declined" | "pending";
  paymentMethod: string;
  cardType?: string;
  timestamp: Date;
  merchantName?: string;
  location?: string;
}

interface Terminal {
  id: string;
  terminalId: string;
  name: string;
  status: "active" | "inactive" | "offline";
  lastTransaction?: Date;
  totalToday: number;
  transactionCount: number;
  location: string;
}

interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  approvalRate: number;
  activeTerminals: number;
  averageTransaction: number;
  hourlyTrend: any[];
}

export default function BackOffice() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx_001",
      terminalId: "TRM_001",
      amount: 250.0,
      currency: "USD",
      status: "approved",
      paymentMethod: "card",
      cardType: "visa",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      merchantName: "Coffee Shop A",
      location: "New York, NY",
    },
    {
      id: "tx_002",
      terminalId: "TRM_002",
      amount: 125.5,
      currency: "USD",
      status: "approved",
      paymentMethod: "contactless",
      cardType: "mastercard",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      merchantName: "Restaurant B",
      location: "Los Angeles, CA",
    },
    {
      id: "tx_003",
      terminalId: "TRM_003",
      amount: 50.0,
      currency: "USD",
      status: "declined",
      paymentMethod: "chip",
      cardType: "amex",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      merchantName: "Retail C",
      location: "Chicago, IL",
    },
  ]);

  const [terminals, setTerminals] = useState<Terminal[]>([
    {
      id: "tm_001",
      terminalId: "TRM_001",
      name: "Main Counter",
      status: "active",
      lastTransaction: new Date(Date.now() - 5 * 60 * 1000),
      totalToday: 2500.0,
      transactionCount: 12,
      location: "New York, NY",
    },
    {
      id: "tm_002",
      terminalId: "TRM_002",
      name: "Secondary Counter",
      status: "active",
      lastTransaction: new Date(Date.now() - 10 * 60 * 1000),
      totalToday: 1850.0,
      transactionCount: 9,
      location: "Los Angeles, CA",
    },
    {
      id: "tm_003",
      terminalId: "TRM_003",
      name: "Front Desk",
      status: "offline",
      lastTransaction: new Date(Date.now() - 2 * 60 * 60 * 1000),
      totalToday: 500.0,
      transactionCount: 2,
      location: "Chicago, IL",
    },
  ]);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 4850.0,
    totalTransactions: 23,
    approvalRate: 95.7,
    activeTerminals: 2,
    averageTransaction: 210.87,
    hourlyTrend: [
      { hour: "00:00", transactions: 5, amount: 1200 },
      { hour: "04:00", transactions: 2, amount: 450 },
      { hour: "08:00", transactions: 8, amount: 2100 },
      { hour: "12:00", transactions: 12, amount: 3200 },
      { hour: "16:00", transactions: 6, amount: 1500 },
      { hour: "20:00", transactions: 3, amount: 800 },
    ],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [timeRange, setTimeRange] = useState("today");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<"transactions" | "alerts" | "invoices">("transactions");

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        terminalId: `TRM_${Math.floor(Math.random() * 3) + 1}`,
        amount: Math.floor(Math.random() * 300) + 10,
        currency: "USD",
        status: Math.random() > 0.05 ? "approved" : "declined",
        paymentMethod: ["card", "contactless", "chip"][Math.floor(Math.random() * 3)],
        cardType: ["visa", "mastercard", "amex"][Math.floor(Math.random() * 3)],
        timestamp: new Date(),
        merchantName: "Merchant " + String.fromCharCode(65 + Math.floor(Math.random() * 3)),
        location: ["New York, NY", "Los Angeles, CA", "Chicago, IL"][Math.floor(Math.random() * 3)],
      };

      setTransactions((prev) => [newTransaction, ...prev.slice(0, 19)]);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.terminalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount.toString().includes(searchTerm);

    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-8">
        {/* Header Section */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Back Office</h1>
              <p className="text-gray-600 mt-1">Enterprise operations dashboard</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  autoRefresh
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
                Auto-Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "transactions"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "alerts"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Bell className="w-4 h-4" />
              Alerts & Notifications
            </button>
            <button
              onClick={() => setActiveTab("invoices")}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "invoices"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              Digital Invoices
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalTransactions}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Approval Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.approvalRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Active Terminals</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeTerminals}/{terminals.length}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Avg Transaction</p>
                  <p className="text-2xl font-bold text-gray-900">${metrics.averageTransaction.toFixed(2)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Transactions Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Latest Transactions</h2>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        Real-time
                      </span>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by Transaction ID, Terminal..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="declined">Declined</option>
                        <option value="pending">Pending</option>
                      </select>

                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Transaction ID</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Terminal</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{tx.terminalId}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              ${tx.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                {tx.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  tx.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : tx.status === "declined"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {tx.timestamp.toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button className="text-blue-600 hover:text-blue-800 font-medium">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Terminals Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Terminals Status</h2>
                  <div className="space-y-3">
                    {terminals.map((terminal) => (
                      <div key={terminal.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{terminal.name}</h3>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {terminal.location}
                            </p>
                          </div>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              terminal.status === "active"
                                ? "bg-green-600"
                                : terminal.status === "offline"
                                ? "bg-red-600"
                                : "bg-yellow-600"
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Today</p>
                            <p className="font-semibold">${terminal.totalToday.toFixed(0)}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-600">Transactions</p>
                            <p className="font-semibold">{terminal.transactionCount}</p>
                          </div>
                        </div>

                        {terminal.lastTransaction && (
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last: {terminal.lastTransaction.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">System Alerts</h2>
                  <div className="space-y-3">
                    <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900 text-sm">Terminal Offline</p>
                        <p className="text-xs text-red-700">TRM_003 - Front Desk</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 text-sm">High Decline Rate</p>
                        <p className="text-xs text-yellow-700">TRM_003 - 4 declined transactions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === "alerts" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <TerminalAlertManager />
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <DigitalInvoice />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
