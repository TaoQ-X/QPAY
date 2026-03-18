import { useState } from "react";
import Header from "@/components/Header";
import { Calendar, DollarSign, Check, Clock, AlertCircle, Download } from "lucide-react";

interface Settlement {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  amount: number;
  currency: string;
  date: string;
  bankAccount: string;
  transactionCount: number;
}

export default function SettlementManagement() {
  const [settlements, setSettlements] = useState<Settlement[]>([
    {
      id: "settle_001",
      status: "completed",
      amount: 45230.5,
      currency: "USD",
      date: "2024-03-16",
      bankAccount: "****5678",
      transactionCount: 124,
    },
    {
      id: "settle_002",
      status: "processing",
      amount: 28950.75,
      currency: "USD",
      date: "2024-03-17",
      bankAccount: "****5678",
      transactionCount: 87,
    },
    {
      id: "settle_003",
      status: "pending",
      amount: 18500.0,
      currency: "USD",
      date: "2024-03-18",
      bankAccount: "****5678",
      transactionCount: 56,
    },
  ]);

  const [selectedSettlement, setSelectedSettlement] = useState<string | null>(null);

  const getStatusColor = (status: Settlement["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "processing":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "failed":
        return "bg-red-100 text-red-700 border-red-300";
    }
  };

  const getStatusIcon = (status: Settlement["status"]) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settlement Management</h1>
            <p className="text-gray-600 mt-2">Track and manage your fund settlements</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <SummaryCard
              label="Total Pending"
              value="$18,500.00"
              icon={<Clock className="w-6 h-6" />}
            />
            <SummaryCard
              label="Last Settlement"
              value="$45,230.50"
              subtext="Completed"
              icon={<Check className="w-6 h-6" />}
            />
            <SummaryCard
              label="Monthly Volume"
              value="$1,247,890.00"
              subtext="67 settlements"
              icon={<DollarSign className="w-6 h-6" />}
            />
          </div>

          {/* Settlements List */}
          <div className="space-y-4">
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Settlement Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          ${settlement.amount.toFixed(2)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(settlement.status)}`}>
                          {getStatusIcon(settlement.status)}
                          {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600">Settlement ID</p>
                          <p className="font-mono text-sm text-gray-900">{settlement.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Date</p>
                          <p className="text-sm text-gray-900">{settlement.date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Bank Account</p>
                          <p className="text-sm text-gray-900">{settlement.bankAccount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Transactions</p>
                          <p className="text-sm text-gray-900">{settlement.transactionCount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <Download className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() =>
                          setSelectedSettlement(
                            selectedSettlement === settlement.id ? null : settlement.id
                          )
                        }
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedSettlement === settlement.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">Settlement Details</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gross Amount</span>
                              <span className="text-gray-900">${(settlement.amount * 1.02).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Processing Fee</span>
                              <span className="text-gray-900">-${(settlement.amount * 0.02).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-3">
                              <span>Net Amount</span>
                              <span>${settlement.amount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">Timeline</h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-gray-600">Initiated</p>
                              <p className="text-gray-900 font-medium">2024-03-16 08:00 AM</p>
                            </div>
                            <div>
                              <p className="text-gray-600">
                                {settlement.status === "completed" ? "Completed" : "Expected Completion"}
                              </p>
                              <p className="text-gray-900 font-medium">2024-03-17 05:00 PM</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transaction List */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Included Transactions</h4>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-600 border-b border-gray-200">
                                <th className="text-left py-2">Transaction ID</th>
                                <th className="text-right py-2">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-200">
                                  <td className="py-2 text-gray-900">txn_{String(i).padStart(6, "0")}</td>
                                  <td className="text-right py-2 text-gray-900">
                                    ${(settlement.amount / settlement.transactionCount).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-center text-gray-600 text-xs mt-3">
                            +{settlement.transactionCount - 5} more transactions
                          </p>
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

function SummaryCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-600 mt-1">{subtext}</p>}
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </div>
  );
}
