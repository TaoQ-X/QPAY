import Header from "@/components/Header";
import InvoiceAutomationManager from "@/components/InvoiceAutomationManager";

/**
 * Invoice Automation Page
 * Manages automated invoice generation, numbering, and delivery
 */
export default function InvoiceAutomationPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <InvoiceAutomationManager />
        </div>
      </div>
    </div>
  );
}
