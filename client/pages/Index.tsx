import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  BarChart3,
  Lock,
  Cpu,
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                The Future of Blockchain Payments
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
              Instant Blockchain Payments for Modern Commerce
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Accept crypto payments directly on your platform. Settle to your bank
              account in seconds with enterprise-grade security and compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register/sme"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <Link
                to="/docs"
                className="bg-white border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-all hover:shadow-lg"
              >
                View Documentation
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-b from-primary/5 to-transparent rounded-2xl border border-primary/10 p-8 sm:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
                  <div className="text-3xl font-bold text-primary mb-2">$50M+</div>
                  <p className="text-muted-foreground text-sm">
                    Monthly transaction volume
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    2000+
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Active merchants worldwide
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
                  <div className="text-3xl font-bold text-accent mb-2">99.9%</div>
                  <p className="text-muted-foreground text-sm">
                    Network uptime SLA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Enterprise-Grade Blockchain Payments
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All the tools you need to accept crypto payments and settle directly
              to your bank account
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                <Zap size={24} className="text-primary group-hover:text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Instant Settlement
              </h3>
              <p className="text-muted-foreground">
                Receive payments in blockchain in seconds, with automatic settlement
                to your bank account
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-xl border border-border hover:border-secondary/30 hover:bg-secondary/5 transition-all">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-white transition-all">
                <Shield size={24} className="text-secondary group-hover:text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Bank-Level Security
              </h3>
              <p className="text-muted-foreground">
                Multi-signature wallets, cold storage, and advanced encryption
                protect your funds
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 transition-all">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-all">
                <Lock size={24} className="text-accent group-hover:text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Full Compliance
              </h3>
              <p className="text-muted-foreground">
                KYC/AML verification, regulatory reporting, and audit trails
                included
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                <Globe size={24} className="text-primary group-hover:text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Multiple Blockchains
              </h3>
              <p className="text-muted-foreground">
                Accept payments on Bitcoin, Ethereum, Polygon, and more with one
                integration
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-xl border border-border hover:border-secondary/30 hover:bg-secondary/5 transition-all">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-white transition-all">
                <BarChart3 size={24} className="text-secondary group-hover:text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Real-Time Analytics
              </h3>
              <p className="text-muted-foreground">
                Comprehensive dashboards and APIs for transaction tracking and
                reporting
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 transition-all">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-all">
                <Cpu size={24} className="text-accent group-hover:text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Developer Friendly
              </h3>
              <p className="text-muted-foreground">
                REST API, webhooks, and SDKs for seamless integration with your
                systems
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How BlockPay Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple integration, powerful results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Integrate",
                description: "Add our API or plugin to your platform in minutes",
              },
              {
                step: "2",
                title: "Accept",
                description: "Start accepting crypto payments from customers",
              },
              {
                step: "3",
                title: "Settle",
                description: "Funds automatically convert and settle to your bank",
              },
              {
                step: "4",
                title: "Grow",
                description: "Access analytics and expand to new markets",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Ready to Accept Blockchain Payments?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of merchants accepting crypto payments. No credit card
              required for setup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register/sme"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <Link
                to="/register/enterprise"
                className="bg-white border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-all hover:shadow-lg"
              >
                Enterprise Solutions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  Ѳ
                </div>
                <span className="font-bold text-foreground">BlockPay</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Enterprise blockchain payments for modern commerce.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Developers</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/docs"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-primary"
                  >
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-primary"
                  >
                    SDKs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-primary"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <p className="text-center text-muted-foreground text-sm">
              © 2024 BlockPay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
