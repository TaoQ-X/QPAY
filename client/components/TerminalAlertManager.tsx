import React, { useState, useEffect } from "react";
import { AlertCircle, Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertTemplate {
  name: string;
  description: string;
  triggers: any[];
  notificationChannels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    pushNotification: boolean;
  };
}

interface AlertConfig {
  id: string;
  merchantId: string;
  name: string;
  enabled: boolean;
  triggers: any[];
  notificationChannels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    pushNotification: boolean;
  };
  recipients: any[];
}

export function TerminalAlertManager() {
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    channels: {
      email: true,
      sms: true,
      inApp: true,
      pushNotification: false,
    },
    recipients: [{ type: "owner", email: "" }],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/alerts/templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching alert templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!selectedTemplate) {
      alert("Please select a template");
      return;
    }

    const template = templates.find((t) => t.name === selectedTemplate);
    if (!template) return;

    try {
      const response = await fetch("/api/alerts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: "current-merchant",
          name: formData.name,
          enabled: true,
          triggers: template.triggers,
          notificationChannels: formData.channels,
          recipients: formData.recipients,
        }),
      });

      if (response.ok) {
        const newAlert = await response.json();
        setAlerts([...alerts, newAlert]);
        setShowForm(false);
        setFormData({
          name: "",
          channels: {
            email: true,
            sms: true,
            inApp: true,
            pushNotification: false,
          },
          recipients: [{ type: "owner", email: "" }],
        });
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error("Error creating alert:", error);
    }
  };

  const toggleChannelHandler = (channel: keyof typeof formData.channels) => {
    setFormData({
      ...formData,
      channels: {
        ...formData.channels,
        [channel]: !formData.channels[channel],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Alert Management</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "Create Alert"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Template
            </label>
            <select
              value={selectedTemplate || ""}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.name} value={template.name}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., High Transaction Alert"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notification Channels
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.channels.email}
                  onChange={() => toggleChannelHandler("email")}
                  className="rounded border-gray-300"
                />
                <Mail className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.channels.sms}
                  onChange={() => toggleChannelHandler("sms")}
                  className="rounded border-gray-300"
                />
                <Smartphone className="h-4 w-4 text-gray-600" />
                <span className="text-sm">SMS</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.channels.inApp}
                  onChange={() => toggleChannelHandler("inApp")}
                  className="rounded border-gray-300"
                />
                <Bell className="h-4 w-4 text-gray-600" />
                <span className="text-sm">In-App Notification</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleCreateAlert}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            Create Alert Configuration
          </button>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Active Alerts</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No alert configurations yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-gray-200 p-4 bg-white hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      {alert.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.triggers.length} trigger(s) configured
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {alert.notificationChannels.email && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          <Mail className="h-3 w-3" />
                          Email
                        </span>
                      )}
                      {alert.notificationChannels.sms && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          <Smartphone className="h-3 w-3" />
                          SMS
                        </span>
                      )}
                      {alert.notificationChannels.inApp && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                          <Bell className="h-3 w-3" />
                          In-App
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      alert.enabled
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-700"
                    )}
                  >
                    {alert.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
