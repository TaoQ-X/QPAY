import Header from "@/components/Header";
import MobileFinancialDashboard from "@/components/MobileFinancialDashboard";

/**
 * Mobile Financial Dashboard Page
 * Complete financial management from any device, anywhere
 */
export default function MobileFinancialDashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <MobileFinancialDashboard />
        </div>
      </div>
    </div>
  );
}
