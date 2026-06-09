import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Placeholder from "./pages/Placeholder";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import Login from "./pages/Login";
import Analytics from "./pages/Analytics";
import Checkout from "./pages/Checkout";
import RegisterSME from "./pages/RegisterSME";
import RegisterEnterprise from "./pages/RegisterEnterprise";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import WebhookManagement from "./pages/WebhookManagement";
import SettlementManagement from "./pages/SettlementManagement";
import APIKeyManagement from "./pages/APIKeyManagement";
import ReportingDashboard from "./pages/ReportingDashboard";
import PaymentTerminal from "./pages/PaymentTerminal";
import BackOffice from "./pages/BackOffice";
import OnboardingWizard from "./pages/OnboardingWizard";
import PaymentLinksPage from "./pages/PaymentLinksPage";
import InvoiceAutomationPage from "./pages/InvoiceAutomationPage";
import CustomerPaymentMethodsPage from "./pages/CustomerPaymentMethodsPage";
import MobileFinancialDashboardPage from "./pages/MobileFinancialDashboardPage";

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/register/sme" element={<RegisterSME />} />
          <Route path="/register/enterprise" element={<RegisterEnterprise />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/webhooks" element={<WebhookManagement />} />
          <Route path="/settlements" element={<SettlementManagement />} />
          <Route path="/api-keys" element={<APIKeyManagement />} />
          <Route path="/reports" element={<ReportingDashboard />} />
          <Route path="/payment-terminal" element={<PaymentTerminal />} />
          <Route path="/back-office" element={<BackOffice />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/payment-links" element={<PaymentLinksPage />} />
          <Route path="/invoices" element={<InvoiceAutomationPage />} />
          <Route path="/customer-payment-methods" element={<CustomerPaymentMethodsPage />} />
          <Route path="/mobile-dashboard" element={<MobileFinancialDashboardPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
