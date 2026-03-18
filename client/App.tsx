import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
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

const queryClient = new QueryClient();

const App = () => (
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
