import { useState } from "react";
import Header from "@/components/Header";
import {
  Plus,
  Download,
  Trash2,
  BarChart3,
  FileText,
  Calendar,
  Filter,
  Settings,
  Clock,
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: "transaction" | "settlement" | "analytics" | "fraud" | "kyc";
  status: "draft" | "generating" | "ready" | "error";
  generatedAt?: string;
  dateRange: string;
  format: string[];
}

export default function ReportingDashboard() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: "rpt_001",
      name: "Daily Summary - March 17",
      type: "transaction",
      status: "ready",
      generatedAt: "2024-03-17 14:30",
      dateRange: "2024-03-17",
      format: ["csv", "pdf", "json"],
    },
    {
      id: "rpt_002",
      name: "Monthly Settlement Report",
      type: "settlement",
      status: "ready",
      generatedAt: "2024-03-16 10:00",
      dateRange: "2024-03-01 to 2024-03-31",
      format: ["csv", "excel", "pdf"],
    },
  ]);

  const [activeTab, setActiveTab] = useState<"reports" | "templates" | "schedule">("reports");
  const [showNewReport, setShowNewReport] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "transaction" as Report["type"],
    startDate: "",
    endDate: "",
    formats: ["csv"] as string[],
  });

  const templates = [
    { id: "daily", name: "Daily Summary", type: "transaction", description: "Daily transactions overview" },
    { id: "monthly", name: "Monthly Analytics", type: "analytics", description: "Monthly performance metrics" },
    { id: "settlement", name: "Settlement Report", type: "settlement", description: "Settlement tracking" },
    { id: "fraud", name: "Fraud Analysis", type: "fraud", description: "Fraud detection report" },
  ];

  const handleCreateReport = () => {
    if (formData.name && formData.startDate && formData.endDate) {
      const newReport: Report = {
        id: `rpt_${Date.now()}`,
        name: formData.name,
        type: formData.type,
        status: "generating",
        dateRange: `${formData.startDate} to ${formData.endDate}`,
        format: formData.formats,
      };
      setReports([...reports, newReport]);
      setFormData({ name: "", type: "transaction", startDate: "", endDate: "", formats: ["csv"] });
      setShowNewReport(false);
    }
  };

  const handleDownload = (reportId: string, format: string) => {
    console.log(`Downloading ${reportId} as ${format}`);
    // In production: Actual download
  };

  const handleDeleteReport = (reportId: string) => {
    setReports(reports.filter((r) => r.id !== reportId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Generate and manage business reports</p>
            </div>
            <button
              onClick={() => setShowNewReport(!showNewReport)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Report
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            {["reports", "templates", "schedule"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === tab
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                {tab === "reports" && <BarChart3 className="w-4 h-4 inline mr-2" />}
                {tab === "templates" && <FileText className="w-4 h-4 inline mr-2" />}
                {tab === "schedule" && <Clock className="w-4 h-4 inline mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* New Report Form */}
          {showNewReport && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Report</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Revenue Report"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="transaction">Transactions</option>
                    <option value="settlement">Settlements</option>
                    <option value="analytics">Analytics</option>
                    <option value="fraud">Fraud Detection</option>
                    <option value="kyc">KYC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Formats
                </label>
                <div className="space-y-2">
                  {["csv", "pdf", "json", "excel"].map((fmt) => (
                    <label key={fmt} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.formats.includes(fmt)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              formats: [...formData.formats, fmt],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              formats: formData.formats.filter((f) => f !== fmt),
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{fmt.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateReport}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Report
                </button>
                <button
                  onClick={() => setShowNewReport(false)}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {report.type}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            report.status === "ready"
                              ? "bg-green-100 text-green-700"
                              : report.status === "generating"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {report.status}
                        </span>
                        {report.generatedAt && (
                          <span>Generated: {report.generatedAt}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {report.dateRange}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {report.status === "ready" && (
                        <div className="flex gap-1">
                          {report.format.map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => handleDownload(report.id, fmt)}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                            >
                              <Download className="w-3 h-3" />
                              {fmt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                  <div className="mt-4">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {template.type}
                    </span>
                  </div>
                  <button className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === "schedule" && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h2>
              <p className="text-gray-600 mb-6">
                Set up automatic report generation and delivery on a schedule
              </p>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Daily Summary</h3>
                      <p className="text-sm text-gray-600">Sent every day at 8:00 AM</p>
                    </div>
                  </div>
                </div>

                <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Schedule New Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
