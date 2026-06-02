import { useState } from "react";
import {
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceJob {
  id: string;
  transaction_id: string;
  invoice_number: string;
  status: "pending" | "generating" | "generated" | "sending" | "sent" | "failed";
  invoice_url?: string;
  recipient_email?: string;
  recipient_phone?: string;
  sent_at?: string;
  created_at: string;
}

interface InvoiceStats {
  total_generated: number;
  successfully_sent: number;
  failed: number;
  unique_transactions: number;
}

export default function InvoiceAutomationManager() {
  const [invoiceJobs, setInvoiceJobs] = useState<InvoiceJob[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [showSequenceForm, setShowSequenceForm] = useState(false);
  const [sequenceConfig, setSequenceConfig] = useState({
    prefix: "INV",
    padding_digits: 6,
    format_template: "{prefix}-{sequence}",
  });

  const initializeSequence = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/invoices/sequences/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sequenceConfig),
      });

      if (!response.ok) throw new Error("Failed to initialize sequence");

      const result = await response.json();

      if (result.success) {
        toast.success("Invoice sequence initialized!");
        setShowSequenceForm(false);
      }
    } catch (error) {
      console.error("Error initializing sequence:", error);
      toast.error("Failed to initialize sequence");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceJobs = async () => {
    setLoading(true);
    try {
      let url = "/api/invoices/jobs";

      if (filter !== "all") {
        url += `?status=${filter}`;
      }

      const response = await fetch(url);

      if (!response.ok) throw new Error("Failed to fetch invoice jobs");

      const result = await response.json();

      if (result.success) {
        setInvoiceJobs(result.data);
      }
    } catch (error) {
      console.error("Error fetching invoice jobs:", error);
      toast.error("Failed to load invoice jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/invoices/automation/stats");

      if (!response.ok) throw new Error("Failed to fetch stats");

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const sendInvoice = async (jobId: string, method: string, recipient: string) => {
    try {
      const response = await fetch(
        `/api/invoices/jobs/${jobId}/delivered`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method, recipient }),
        }
      );

      if (!response.ok) throw new Error("Failed to send invoice");

      const result = await response.json();

      if (result.success) {
        setInvoiceJobs(
          invoiceJobs.map((job) =>
            job.id === jobId ? { ...job, status: "sent" as const } : job
          )
        );
        toast.success(`Invoice sent via ${method}!`);
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-700";
      case "generated":
        return "bg-blue-100 text-blue-700";
      case "sending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      case "sending":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Invoice Automation</h2>
          <p className="text-muted-foreground mt-1">
            Automatic invoice generation and delivery
          </p>
        </div>

        <button
          onClick={() => setShowSequenceForm(!showSequenceForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all"
        >
          Configure Sequence
        </button>
      </div>

      {/* Sequence Configuration */}
      {showSequenceForm && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Invoice Sequence Configuration
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Prefix
                </label>
                <input
                  type="text"
                  value={sequenceConfig.prefix}
                  onChange={(e) =>
                    setSequenceConfig({
                      ...sequenceConfig,
                      prefix: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="INV"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  e.g., INV, 2024-, or custom prefix
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Padding Digits
                </label>
                <input
                  type="number"
                  value={sequenceConfig.padding_digits}
                  onChange={(e) =>
                    setSequenceConfig({
                      ...sequenceConfig,
                      padding_digits: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  e.g., 6 = 000001
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Format Template
              </label>
              <input
                type="text"
                value={sequenceConfig.format_template}
                onChange={(e) =>
                  setSequenceConfig({
                    ...sequenceConfig,
                    format_template: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="{prefix}-{sequence}"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Preview: {sequenceConfig.prefix}-000001
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={initializeSequence}
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "Configuring..." : "Save Configuration"}
              </button>
              <button
                onClick={() => setShowSequenceForm(false)}
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Generated</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.total_generated}
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Successfully Sent</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.successfully_sent}
                </p>
              </div>
              <Send className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.failed}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.unique_transactions}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Filter & Refresh */}
      <div className="flex gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Invoices</option>
          <option value="pending">Pending</option>
          <option value="generating">Generating</option>
          <option value="generated">Generated</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>

        <button
          onClick={() => {
            fetchInvoiceJobs();
            fetchStats();
          }}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {invoiceJobs.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              No invoices found
            </h3>
            <p className="text-muted-foreground">
              Invoices will appear here as they are generated
            </p>
          </div>
        ) : (
          invoiceJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-border rounded-lg p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {job.invoice_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Transaction: {job.transaction_id.slice(0, 8)}...
                  </p>
                </div>

                <span
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    job.status
                  )}`}
                >
                  {getStatusIcon(job.status)}
                  {job.status}
                </span>
              </div>

              {job.recipient_email && (
                <p className="text-sm text-muted-foreground mb-3">
                  📧 {job.recipient_email}
                </p>
              )}

              {job.status === "generated" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const email = prompt(
                        "Enter recipient email:",
                        job.recipient_email
                      );
                      if (email) {
                        sendInvoice(job.id, "email", email);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all text-sm font-medium"
                  >
                    Send via Email
                  </button>

                  <button
                    onClick={() => {
                      const phone = prompt(
                        "Enter recipient phone:",
                        job.recipient_phone
                      );
                      if (phone) {
                        sendInvoice(job.id, "sms", phone);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-all text-sm font-medium"
                  >
                    Send via SMS
                  </button>
                </div>
              )}

              {job.status === "sent" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  ✓ Sent on {new Date(job.sent_at || "").toLocaleDateString()}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                Created: {new Date(job.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
