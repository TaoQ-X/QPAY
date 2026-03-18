import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  Plus,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  Copy,
  Trash2,
  Play,
  Eye,
  EyeOff,
} from "lucide-react";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTestedAt?: string;
  testResult?: "success" | "failed";
  deliverySuccessRate: number;
  totalEvents: number;
}

export default function WebhookManagement() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([
    {
      id: "whk_abc123",
      url: "https://example.com/webhooks/payment",
      events: ["payment.created", "payment.confirmed", "settlement.completed"],
      isActive: true,
      lastTestedAt: "2 hours ago",
      testResult: "success",
      deliverySuccessRate: 99.8,
      totalEvents: 1247,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    events: [] as string[],
    timeout: 30,
  });

  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [secretKey] = useState("sk_test_1234567890abcdef");

  const availableEvents = [
    { id: "payment.created", label: "Payment Created" },
    { id: "payment.confirmed", label: "Payment Confirmed" },
    { id: "payment.failed", label: "Payment Failed" },
    { id: "settlement.created", label: "Settlement Created" },
    { id: "settlement.completed", label: "Settlement Completed" },
    { id: "settlement.failed", label: "Settlement Failed" },
    { id: "kyc.verified", label: "KYC Verified" },
    { id: "kyc.rejected", label: "KYC Rejected" },
    { id: "dispute.opened", label: "Dispute Opened" },
    { id: "dispute.resolved", label: "Dispute Resolved" },
  ];

  const handleAddEndpoint = () => {
    if (formData.url && formData.events.length > 0) {
      const newEndpoint: WebhookEndpoint = {
        id: `whk_${Math.random().toString(36).substr(2, 9)}`,
        url: formData.url,
        events: formData.events,
        isActive: true,
        deliverySuccessRate: 100,
        totalEvents: 0,
      };
      setEndpoints([...endpoints, newEndpoint]);
      setFormData({ url: "", events: [], timeout: 30 });
      setShowForm(false);
    }
  };

  const handleDeleteEndpoint = (id: string) => {
    setEndpoints(endpoints.filter((e) => e.id !== id));
  };

  const handleTestEndpoint = (id: string) => {
    const endpoint = endpoints.find((e) => e.id === id);
    if (endpoint) {
      endpoint.lastTestedAt = "just now";
      endpoint.testResult = Math.random() > 0.2 ? "success" : "failed";
      setEndpoints([...endpoints]);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
              <p className="text-gray-600 mt-2">Configure and manage webhook endpoints</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Endpoint
            </button>
          </div>

          {/* Add Endpoint Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Webhook Endpoint</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/webhooks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Subscribe to Events
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableEvents.map((event) => (
                      <label key={event.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event.id)}
                          onChange={() => toggleEventSelection(event.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.timeout}
                    onChange={(e) =>
                      setFormData({ ...formData, timeout: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddEndpoint}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Endpoint
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Endpoints List */}
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition"
              >
                <div className="p-6">
                  {/* Endpoint Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{endpoint.url}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            endpoint.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {endpoint.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{endpoint.id}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestEndpoint(endpoint.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        Test
                      </button>
                      <button
                        onClick={() => setSelectedEndpoint(selectedEndpoint === endpoint.id ? null : endpoint.id)}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-700 text-sm font-medium"
                      >
                        <Settings className="w-4 h-4" />
                        Details
                      </button>
                      <button
                        onClick={() => handleDeleteEndpoint(endpoint.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Test Result */}
                  {endpoint.lastTestedAt && (
                    <div className="mb-4 flex items-center gap-2">
                      {endpoint.testResult === "success" ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">
                            Last test: {endpoint.lastTestedAt} ✓
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600">
                            Last test failed: {endpoint.lastTestedAt}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600">Success Rate</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {endpoint.deliverySuccessRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Events</p>
                      <p className="text-lg font-semibold text-gray-900">{endpoint.totalEvents}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Events Subscribed</p>
                      <p className="text-lg font-semibold text-gray-900">{endpoint.events.length}</p>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Subscribed Events:</p>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedEndpoint === endpoint.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Secret Key */}
                      <div>
                        <label className="text-sm font-medium text-gray-700">Signing Secret</label>
                        <div className="mt-2 flex items-center gap-2 p-3 bg-gray-100 rounded-lg font-mono text-sm">
                          {showSecretKey ? secretKey : "••••••••••••••••"}
                          <button
                            onClick={() => setShowSecretKey(!showSecretKey)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(secretKey)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Delivery Logs Link */}
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        View Delivery Logs
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {endpoints.length === 0 && !showForm && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No webhooks configured</h3>
              <p className="text-gray-600 mt-2">
                Start by creating your first webhook endpoint to receive real-time events
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
