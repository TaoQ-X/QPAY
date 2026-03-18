import { useState } from "react";
import Header from "@/components/Header";
import { Plus, Copy, RotateCcw, Trash2, Eye, EyeOff, BarChart3, AlertCircle } from "lucide-react";

interface APIKey {
  id: string;
  name: string;
  keyPreview: string;
  permissions: string[];
  rateLimit: { perMinute: number; perDay: number };
  ipWhitelist?: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  usageStats: {
    requestsThisMonth: number;
    requestsToday: number;
    lastRequestTime?: string;
  };
  status: "active" | "inactive" | "revoked";
}

export default function APIKeyManagement() {
  const [keys, setKeys] = useState<APIKey[]>([
    {
      id: "key_1",
      name: "Production API Key",
      keyPreview: "sk_live_****...fg91",
      permissions: ["payments", "settlements", "accounts", "webhooks"],
      rateLimit: { perMinute: 100, perDay: 10000 },
      ipWhitelist: ["192.168.1.100"],
      createdAt: "2024-01-15",
      lastUsedAt: "2 minutes ago",
      expiresAt: "2025-01-15",
      usageStats: {
        requestsThisMonth: 24562,
        requestsToday: 487,
        lastRequestTime: "2024-03-17 14:32:15",
      },
      status: "active",
    },
  ]);

  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["payments"]);

  const availablePermissions = [
    { id: "payments", label: "Process Payments" },
    { id: "settlements", label: "View Settlements" },
    { id: "accounts", label: "Manage Accounts" },
    { id: "webhooks", label: "Configure Webhooks" },
    { id: "analytics", label: "View Analytics" },
  ];

  const handleGenerateKey = () => {
    if (!newKeyName) return;

    const newKey: APIKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      keyPreview: `sk_live_****...${Math.random().toString(36).substr(2, 5)}`,
      permissions: selectedPermissions,
      rateLimit: { perMinute: 100, perDay: 10000 },
      createdAt: new Date().toISOString().split("T")[0],
      lastUsedAt: undefined,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      usageStats: {
        requestsThisMonth: 0,
        requestsToday: 0,
      },
      status: "active",
    };

    setKeys([...keys, newKey]);
    setNewKeyName("");
    setSelectedPermissions(["payments"]);
    setShowNewKeyForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
              <p className="text-gray-600 mt-2">Manage your API keys and permissions</p>
            </div>
            <button
              onClick={() => setShowNewKeyForm(!showNewKeyForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Generate Key
            </button>
          </div>

          {/* New Key Form */}
          {showNewKeyForm && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New API Key</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Payments"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {availablePermissions.map((perm) => (
                      <label key={perm.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, perm.id]);
                            } else {
                              setSelectedPermissions(
                                selectedPermissions.filter((p) => p !== perm.id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateKey}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Generate Key
                  </button>
                  <button
                    onClick={() => setShowNewKeyForm(false)}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            key.status === "active"
                              ? "bg-green-100 text-green-700"
                              : key.status === "inactive"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {key.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Created: {key.createdAt}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedKey(selectedKey === key.id ? null : key.id)
                        }
                        className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        Details
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded-lg text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Key Display */}
                  <div className="bg-gray-50 rounded p-3 mb-4 flex items-center gap-2 font-mono text-sm">
                    {showSecret ? key.keyPreview.replace("****", "sk_live_1234") : key.keyPreview}
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-gray-600 hover:text-gray-700 ml-auto"
                    >
                      {showSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          key.keyPreview.replace("****", "sk_live_1234")
                        )
                      }
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Requests Today</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {key.usageStats.requestsToday}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Monthly Requests</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {key.usageStats.requestsThisMonth}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Last Used</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {key.lastUsedAt || "Never"}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedKey === key.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Permissions</h4>
                        <div className="flex flex-wrap gap-2">
                          {key.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Rate Limits</h4>
                          <div className="text-sm space-y-1 text-gray-600">
                            <p>Per Minute: {key.rateLimit.perMinute} requests</p>
                            <p>Per Day: {key.rateLimit.perDay} requests</p>
                          </div>
                        </div>

                        {key.ipWhitelist && key.ipWhitelist.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">IP Whitelist</h4>
                            <div className="text-sm space-y-1 text-gray-600">
                              {key.ipWhitelist.map((ip) => (
                                <p key={ip}>{ip}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Usage Chart
                        </h4>
                        <div className="bg-gray-50 h-32 rounded flex items-center justify-center text-gray-500">
                          Chart would go here
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
