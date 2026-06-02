import Header from "@/components/Header";
import CustomerPaymentMethodsManager from "@/components/CustomerPaymentMethodsManager";

export default function CustomerPaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <CustomerPaymentMethodsManager />
        </div>
      </div>
    </div>
  );
}
