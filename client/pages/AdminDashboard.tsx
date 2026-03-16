import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  BarChart3,
  Users,
  AlertCircle,
  Settings,
  TrendingUp,
  Shield,
  Server,
  Activity,
  Database,
  Zap,
  Eye,
  Lock,
  Clock,
} from "lucide-react";

interface SystemMetrics {
  totalTransactions: number;
  totalUsers: number;
  systemHealth: number;
  averageResponseTime: number;
  uptime: number;
  fraudDetectionRate: number;
  errorRate: number;
  cacheHitRate: number;
  queueLength: number;
  databaseHealth: number;
}

interface AdminTab {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalTransactions: 2847,
    totalUsers: 342,
    systemHealth: 98.5,
    averageResponseTime: 145,
    uptime: 99.98,
    fraudDetectionRate: 12.3,
    errorRate: 0.23,
    cacheHitRate: 87.5,
    queueLength: 12,
    databaseHealth: 99.2,
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const tabs: AdminTab[] = [
    { id: "overview", name: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users", name: "Users & KYC", icon: <Users className="w-4 h-4" /> },
    { id: "transactions", name: "Transactions", icon: <Activity className="w-4 h-4" /> },
    { id: "fraud", name: "Fraud Detection", icon: <Shield className="w-4 h-4" /> },
    { id: "infrastructure", name: "Infrastructure", icon: <Server className="w-4 h-4" /> },
    { id: "settings", name: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setMetrics({
          totalTransactions: 2847,
          totalUsers: 342,
          systemHealth: 98.5 + Math.random() * 1.5,
          averageResponseTime: 140 + Math.random() * 30,
          uptime: 99.98,
          fraudDetectionRate: 12.3 + Math.random() * 2,
          errorRate: 0.23 + Math.random() * 0.1,
          cacheHitRate: 87.5 + Math.random() * 5,
          queueLength: Math.floor(Math.random() * 50),
          databaseHealth: 99.2 - Math.random() * 0.5,
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Admin Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">System administration and monitoring</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="System Health"
                  value={`${metrics.systemHealth.toFixed(1)}%`}
                  icon={<Activity className="w-6 h-6" />}
                  color="green"
                />
                <MetricCard
                  label="Total Transactions"
                  value={metrics.totalTransactions.toLocaleString()}
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="blue"
                />
                <MetricCard
                  label="Active Users"
                  value={metrics.totalUsers.toLocaleString()}
                  icon={<Users className="w-6 h-6" />}
                  color="purple"
                />
                <MetricCard
                  label="Uptime"
                  value={`${metrics.uptime.toFixed(2)}%`}
                  icon={<Clock className="w-6 h-6" />}
                  color="emerald"
                />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  label="Avg Response Time"
                  value={`${Math.round(metrics.averageResponseTime)}ms`}
                  icon={<Zap className="w-6 h-6" />}
                  color="yellow"
                />
                <MetricCard
                  label="Cache Hit Rate"
                  value={`${metrics.cacheHitRate.toFixed(1)}%`}
                  icon={<Database className="w-6 h-6" />}
                  color="cyan"
                />
                <MetricCard
                  label="Database Health"
                  value={`${metrics.databaseHealth.toFixed(1)}%`}
                  icon={<Server className="w-6 h-6" />}
                  color="lime"
                />
              </div>

              {/* Alerts & Issues */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
                </div>
                <div className="space-y-3">
                  <AlertItem
                    type="warning"
                    message="Queue length exceeding 50 items"
                    time="2 minutes ago"
                  />
                  <AlertItem
                    type="info"
                    message="KYC verification batch processing completed"
                    time="15 minutes ago"
                  />
                  <AlertItem
                    type="success"
                    message="Nightly database backup completed successfully"
                    time="1 hour ago"
                  />
                </div>
              </div>
            </div>
          )}

          {/* USERS & KYC TAB */}
          {activeTab === "users" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">KYC Verification Queue</h3>
                <div className="space-y-3">
                  <UserVerificationItem status="pending" count={24} />
                  <UserVerificationItem status="verified" count={315} />
                  <UserVerificationItem status="rejected" count={3} />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">User Statistics</h3>
                <div className="space-y-4 text-gray-300">
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-semibold text-white">{metrics.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active This Month</span>
                    <span className="font-semibold text-white">267</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Users (7d)</span>
                    <span className="font-semibold text-white">34</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Churn Rate</span>
                    <span className="font-semibold text-white">0.8%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === "transactions" && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-6">Transaction Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Today's Volume</p>
                  <p className="text-3xl font-bold text-white">$2.4M</p>
                  <p className="text-xs text-green-400 mt-1">↑ 12% vs yesterday</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Success Rate</p>
                  <p className="text-3xl font-bold text-white">99.77%</p>
                  <p className="text-xs text-gray-400 mt-1">23 failed transactions</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Avg Transaction Size</p>
                  <p className="text-3xl font-bold text-white">$2,847</p>
                  <p className="text-xs text-gray-400 mt-1">Settlement: 99.2% complete</p>
                </div>
              </div>
            </div>
          )}

          {/* FRAUD DETECTION TAB */}
          {activeTab === "fraud" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  Fraud Detection
                </h3>
                <div className="space-y-4 text-gray-300">
                  <div className="flex justify-between">
                    <span>Detection Rate</span>
                    <span className="font-semibold text-white">{metrics.fraudDetectionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blocked Transactions</span>
                    <span className="font-semibold text-white">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Score Avg</span>
                    <span className="font-semibold text-white">18.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blocked IPs</span>
                    <span className="font-semibold text-white">47</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Detections</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>🔴 High risk: Card testing attempt</p>
                  <p>🟡 Medium risk: Geographic velocity</p>
                  <p>🟢 Low risk: First-time transaction</p>
                  <p>🔴 Critical: Chargeback filed</p>
                </div>
              </div>
            </div>
          )}

          {/* INFRASTRUCTURE TAB */}
          {activeTab === "infrastructure" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Services Health
                </h3>
                <div className="space-y-3">
                  <ServiceStatus name="API Server" status="healthy" />
                  <ServiceStatus name="Database" status="healthy" />
                  <ServiceStatus name="Cache (Redis)" status="healthy" />
                  <ServiceStatus name="Queue Service" status="healthy" />
                  <ServiceStatus name="WebSocket" status="healthy" />
                  <ServiceStatus name="Encryption Service" status="healthy" />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Queue Status</h3>
                <div className="space-y-4 text-gray-300">
                  <div className="flex justify-between">
                    <span>Pending Jobs</span>
                    <span className="font-semibold text-white">{metrics.queueLength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processed Today</span>
                    <span className="font-semibold text-white">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Jobs</span>
                    <span className="font-semibold text-white">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Processing Time</span>
                    <span className="font-semibold text-white">245ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-6">System Settings</h3>
              <div className="space-y-6">
                <SettingItem label="API Rate Limit" value="100 requests/minute" />
                <SettingItem label="Transaction Timeout" value="30 seconds" />
                <SettingItem label="KYC Verification Timeout" value="48 hours" />
                <SettingItem label="Cache TTL" value="5 minutes" />
                <SettingItem label="Log Retention" value="30 days" />
                <SettingItem label="Backup Frequency" value="Daily at 2:00 AM UTC" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: "text-green-500 bg-green-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    yellow: "text-yellow-500 bg-yellow-500/10",
    cyan: "text-cyan-500 bg-cyan-500/10",
    lime: "text-lime-500 bg-lime-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className={`inline-block p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-400 mt-3">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function AlertItem({
  type,
  message,
  time,
}: {
  type: "warning" | "info" | "success";
  message: string;
  time: string;
}) {
  const colors = {
    warning: "text-yellow-400 border-yellow-500/30",
    info: "text-blue-400 border-blue-500/30",
    success: "text-green-400 border-green-500/30",
  };

  return (
    <div className={`p-3 rounded border ${colors[type]} bg-gray-700/30`}>
      <div className="font-medium">{message}</div>
      <div className="text-xs text-gray-500 mt-1">{time}</div>
    </div>
  );
}

function UserVerificationItem({ status, count }: { status: string; count: number }) {
  const statusColors = {
    pending: "text-yellow-400",
    verified: "text-green-400",
    rejected: "text-red-400",
  };

  return (
    <div className="flex justify-between p-3 bg-gray-700/30 rounded border border-gray-600">
      <span className={statusColors[status as keyof typeof statusColors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      <span className="font-semibold text-white">{count}</span>
    </div>
  );
}

function ServiceStatus({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded border border-gray-600">
      <span className="text-gray-300">{name}</span>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-xs text-green-400">{status}</span>
      </div>
    </div>
  );
}

function SettingItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-4 rounded border border-gray-600 hover:border-gray-500">
      <span className="text-gray-300">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
