import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      subtitle: "For Small Businesses",
      price: "Free",
      period: "Up to $5,000/month",
      description: "Perfect for testing and small operations",
      color: "primary",
      features: [
        "Up to $5,000 monthly volume",
        "All payment methods",
        "Bitcoin, Ethereum, Polygon",
        "2.5% transaction fee",
        "Email support",
        "Basic analytics",
        "Daily settlements",
        "KYC verification",
        "API access",
      ],
      limitations: [
        "No white-label",
        "Standard support (24-48 hours)",
      ],
      cta: "Get Started",
      link: "/register/sme",
      highlighted: false,
    },
    {
      name: "Professional",
      subtitle: "For Growing Businesses",
      price: "$299",
      period: "/month",
      description: "Scale your payment operations",
      color: "secondary",
      features: [
        "Up to $100,000 monthly volume",
        "All payment methods",
        "6+ blockchain networks",
        "1.8% transaction fee",
        "Priority email support",
        "Advanced analytics",
        "Daily/Weekly/Monthly settlements",
        "Custom API endpoints",
        "Webhook integrations",
        "Recurring billing",
        "Fraud detection AI",
        "Monthly strategy call",
      ],
      limitations: [
        "Limited white-label customization",
      ],
      cta: "Start Free Trial",
      link: "/register/sme",
      highlighted: true,
    },
    {
      name: "Enterprise",
      subtitle: "For Large Operations",
      price: "Custom",
      period: "Volume-based",
      description: "Unlimited transactions with dedicated support",
      color: "accent",
      features: [
        "Unlimited monthly volume",
        "All payment methods",
        "All blockchain networks",
        "Custom transaction fees",
        "24/7 phone & email support",
        "Custom dashboards",
        "Dedicated account manager",
        "Advanced integrations",
        "White-label solutions",
        "Custom settlement schedules",
        "Full API customization",
        "Compliance reporting",
        "Insurance coverage",
        "Multi-region support",
      ],
      limitations: [],
      cta: "Contact Sales",
      link: "/register/enterprise",
      highlighted: false,
    },
  ];

  const featureComparison = [
    {
      category: "Payment Methods",
      features: [
        { name: "Apple Pay", starter: true, pro: true, enterprise: true },
        { name: "Google Pay", starter: true, pro: true, enterprise: true },
        { name: "Credit Cards", starter: true, pro: true, enterprise: true },
        { name: "Bank Transfer", starter: false, pro: true, enterprise: true },
        { name: "Crypto Direct", starter: true, pro: true, enterprise: true },
      ],
    },
    {
      category: "Blockchains",
      features: [
        { name: "Bitcoin", starter: true, pro: true, enterprise: true },
        { name: "Ethereum", starter: true, pro: true, enterprise: true },
        { name: "Polygon", starter: true, pro: true, enterprise: true },
        { name: "Solana", starter: false, pro: true, enterprise: true },
        { name: "All Networks", starter: false, pro: false, enterprise: true },
      ],
    },
    {
      category: "Support & Security",
      features: [
        { name: "Email Support", starter: true, pro: true, enterprise: true },
        { name: "Priority Support", starter: false, pro: true, enterprise: true },
        { name: "24/7 Phone Support", starter: false, pro: false, enterprise: true },
        { name: "Dedicated Manager", starter: false, pro: false, enterprise: true },
        { name: "Insurance Coverage", starter: false, pro: false, enterprise: true },
      ],
    },
    {
      category: "Integration & Customization",
      features: [
        { name: "API Access", starter: true, pro: true, enterprise: true },
        { name: "Webhooks", starter: false, pro: true, enterprise: true },
        { name: "Custom Endpoints", starter: false, pro: true, enterprise: true },
        { name: "White-Label", starter: false, pro: false, enterprise: true },
        { name: "Private Integrations", starter: false, pro: false, enterprise: true },
      ],
    },
  ];

  const faqs = [
    {
      question: "Can I upgrade or downgrade my plan?",
      answer:
        "Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, bank transfers, and cryptocurrency. For enterprise plans, we offer custom payment terms.",
    },
    {
      question: "Is there a setup fee?",
      answer:
        "No setup fees for any plan. Starter is completely free. Professional has a $299/month fee. Enterprise pricing is custom.",
    },
    {
      question: "What if I exceed my monthly volume limit?",
      answer:
        "Starter accounts over $5,000/month are automatically upgraded to Professional. No service interruptions.",
    },
    {
      question: "Do you offer API rate limiting?",
      answer:
        "Starter: 100 requests/min. Professional: 1,000 requests/min. Enterprise: Unlimited with dedicated infrastructure.",
    },
    {
      question: "What about refunds?",
      answer:
        "We offer 30-day money-back guarantee for Professional plans. Enterprise agreements are custom.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business. Scale as you grow.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 transition-all ${
                  plan.highlighted
                    ? "bg-primary border-2 border-primary shadow-2xl scale-105"
                    : "bg-white border border-border hover:shadow-lg"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      plan.highlighted
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${
                      plan.highlighted
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {plan.subtitle}
                  </p>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span
                      className={`text-4xl font-bold ${
                        plan.highlighted
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={
                        plan.highlighted
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      plan.highlighted
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <Link
                  to={plan.link}
                  className={`w-full py-3 rounded-lg font-semibold text-center mb-8 transition-all flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? "bg-white text-primary hover:bg-opacity-90"
                      : "bg-primary text-primary-foreground hover:bg-opacity-90"
                  }`}
                >
                  {plan.cta} <ArrowRight size={18} />
                </Link>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li
                      key={fidx}
                      className={`flex items-start gap-3 text-sm ${
                        plan.highlighted
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      <CheckCircle
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          plan.highlighted
                            ? "text-primary-foreground"
                            : "text-accent"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div
                    className={`border-t pt-6 ${
                      plan.highlighted
                        ? "border-primary-foreground/20"
                        : "border-border"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold mb-2 ${
                        plan.highlighted
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      Limitations
                    </p>
                    <ul className="space-y-1">
                      {plan.limitations.map((limit, lidx) => (
                        <li
                          key={lidx}
                          className={`text-xs ${
                            plan.highlighted
                              ? "text-primary-foreground/60"
                              : "text-muted-foreground"
                          }`}
                        >
                          • {limit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-16 text-center">
            Detailed Feature Comparison
          </h2>

          <div className="space-y-12">
            {featureComparison.map((section, idx) => (
              <div key={idx} className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-8 py-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">
                    {section.category}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {section.features.map((feature, fidx) => (
                        <tr
                          key={fidx}
                          className="border-b border-border hover:bg-muted/30"
                        >
                          <td className="px-8 py-4 text-foreground font-medium">
                            {feature.name}
                          </td>
                          <td className="px-8 py-4 text-center">
                            {feature.starter ? (
                              <CheckCircle className="w-5 h-5 text-accent mx-auto" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-border rounded mx-auto" />
                            )}
                          </td>
                          <td className="px-8 py-4 text-center">
                            {feature.pro ? (
                              <CheckCircle className="w-5 h-5 text-secondary mx-auto" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-border rounded mx-auto" />
                            )}
                          </td>
                          <td className="px-8 py-4 text-center">
                            {feature.enterprise ? (
                              <CheckCircle className="w-5 h-5 text-accent mx-auto" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-border rounded mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-muted/30 px-8 py-4 flex gap-12">
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-muted-foreground">Starter</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-muted-foreground">Professional</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-muted-foreground">Enterprise</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-16 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group border border-border rounded-lg p-6 cursor-pointer hover:bg-muted/30 transition-all"
              >
                <summary className="flex items-center justify-between font-semibold text-foreground">
                  {faq.question}
                  <span className="ml-4 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of businesses accepting blockchain payments
          </p>
          <Link
            to="/register/sme"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
          >
            Start Your Free Trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2024 Q Pay. All pricing is transparent and secure.</p>
        </div>
      </footer>
    </div>
  );
}
