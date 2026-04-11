import React, { useState, useEffect } from "react";
import { Download, Mail, MessageSquare, Printer, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  merchantId: string;
  terminalId: string;
  transactionId: string;
  amount: number;
  currency: string;
  date: Date;
  customerEmail?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  taxAmount: number;
  total: number;
  paymentMethod: string;
  cardLastFour?: string;
  status: "draft" | "issued" | "sent" | "viewed" | "paid";
  signature: string;
  sendMethods: {
    email: { sent: boolean; timestamp?: Date };
    sms: { sent: boolean; timestamp?: Date };
    printed: { sent: boolean; timestamp?: Date };
  };
}

interface DigitalInvoiceProps {
  invoiceId?: string;
  onClose?: () => void;
}

export function DigitalInvoice({ invoiceId, onClose }: DigitalInvoiceProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(!!invoiceId);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (channels: ("email" | "sms" | "print")[]) => {
    if (!invoice) return;

    try {
      setSending(true);
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, channels }),
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        setInvoice(updatedInvoice);
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No invoice found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-sm text-gray-600 mt-2">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Date:{" "}
              {new Date(invoice.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <span
              className={cn(
                "inline-block rounded-full px-3 py-1 text-xs font-medium mt-2",
                {
                  "bg-blue-50 text-blue-700": invoice.status === "draft",
                  "bg-green-50 text-green-700": invoice.status === "issued",
                  "bg-purple-50 text-purple-700": invoice.status === "sent",
                  "bg-yellow-50 text-yellow-700": invoice.status === "viewed",
                  "bg-emerald-50 text-emerald-700": invoice.status === "paid",
                }
              )}
            >
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Invoice Items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Description
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Qty
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Unit Price
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-900">{item.description}</td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {item.quantity}
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {item.unitPrice.toFixed(2)}
                </td>
                <td className="text-right py-3 px-4 text-gray-900 font-medium">
                  {item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900 font-medium">
                {(invoice.total - invoice.taxAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Tax:</span>
              <span className="text-gray-900 font-medium">
                {invoice.taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="font-bold text-lg text-blue-600">
                {invoice.currency} {invoice.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600">Payment Method:</dt>
                <dd className="text-gray-900">{invoice.paymentMethod}</dd>
              </div>
              {invoice.cardLastFour && (
                <div>
                  <dt className="text-gray-600">Card:</dt>
                  <dd className="text-gray-900">****{invoice.cardLastFour}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-600">Terminal:</dt>
                <dd className="text-gray-900">{invoice.terminalId}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Digital Signature
            </h3>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-sm">
                <p className="text-green-900 font-medium">Signature Verified</p>
                <p className="text-green-600 text-xs">{invoice.signature}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Options */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Send Invoice</h3>
        <div className="grid grid-cols-3 gap-3">
          {invoice.customerEmail && (
            <button
              onClick={() => handleSendInvoice(["email"])}
              disabled={sending || invoice.sendMethods.email.sent}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors",
                invoice.sendMethods.email.sent
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              <Mail className="h-4 w-4" />
              Email
              {invoice.sendMethods.email.sent && (
                <CheckCircle className="h-4 w-4 ml-auto" />
              )}
            </button>
          )}

          {invoice.customerPhone && (
            <button
              onClick={() => handleSendInvoice(["sms"])}
              disabled={sending || invoice.sendMethods.sms.sent}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors",
                invoice.sendMethods.sms.sent
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              SMS
              {invoice.sendMethods.sms.sent && (
                <CheckCircle className="h-4 w-4 ml-auto" />
              )}
            </button>
          )}

          <button
            onClick={() => handleSendInvoice(["print"])}
            disabled={sending || invoice.sendMethods.printed.sent}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors",
              invoice.sendMethods.printed.sent
                ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            )}
          >
            <Printer className="h-4 w-4" />
            Print
            {invoice.sendMethods.printed.sent && (
              <CheckCircle className="h-4 w-4 ml-auto" />
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        )}
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors">
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
