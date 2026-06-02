import Header from "@/components/Header";
import PaymentLinkGenerator from "@/components/PaymentLinkGenerator";

/**
 * Payment Links Page
 * Create and manage shareable payment links for customers
 */
export default function PaymentLinksPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <PaymentLinkGenerator />
        </div>
      </div>
    </div>
  );
}
