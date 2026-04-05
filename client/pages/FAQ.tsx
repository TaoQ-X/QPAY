import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const faqs: FAQItem[] = [
    {
      id: "getting-started-1",
      category: "Getting Started",
      question: "How do I get started with QPay?",
      answer: "Simply sign up for a free account, complete KYC verification, link your bank account, and generate API keys. You can start accepting payments within 24 hours. Check our Onboarding Wizard for step-by-step guidance.",
      tags: ["onboarding", "account", "setup"],
    },
    {
      id: "getting-started-2",
      category: "Getting Started",
      question: "What's the difference between SME and Enterprise plans?",
      answer: "SME plans start at $99/month with up to $100K monthly volume. Enterprise plans offer unlimited volume with custom pricing, dedicated support, and advanced features like custom webhooks and multi-currency settlement.",
      tags: ["pricing", "plans", "features"],
    },
    {
      id: "getting-started-3",
      category: "Getting Started",
      question: "Is there a trial period?",
      answer: "Yes! All new accounts get a 14-day free trial with full access to core features. No credit card required. After the trial, you can choose a plan or continue as a free user with limitations.",
      tags: ["trial", "free", "onboarding"],
    },
    {
      id: "payments-1",
      category: "Payments",
      question: "What payment methods do you support?",
      answer: "We support: Credit/debit cards, bank transfers, Apple Pay, Google Pay, cryptocurrency (Bitcoin, Ethereum, USDT), and local payment methods by region. Integration with major payment networks (Visa, Mastercard) is included.",
      tags: ["payment methods", "integrations", "crypto"],
    },
    {
      id: "payments-2",
      category: "Payments",
      question: "How long does settlement take?",
      answer: "Standard settlement takes 1-2 business days. With our Express Settlement (fees apply), you can get funds within hours. Crypto payouts are processed within 30 minutes on the blockchain.",
      tags: ["settlement", "timeline", "payout"],
    },
    {
      id: "payments-3",
      category: "Payments",
      question: "What are your transaction fees?",
      answer: "Our standard pricing: 2.9% + $0.30 per transaction for cards, 1.5% for bank transfers, 0% for crypto (network fees apply). Enterprise customers get custom rates. See our Pricing page for detailed breakdown.",
      tags: ["fees", "pricing", "charges"],
    },
    {
      id: "payments-4",
      category: "Payments",
      question: "Do you support recurring/subscription billing?",
      answer: "Yes! QPay supports recurring payments, subscriptions, and automatic billing. You can set up flexible billing cycles, manage subscriptions via API, and handle failed payment retries automatically.",
      tags: ["recurring", "subscriptions", "billing"],
    },
    {
      id: "security-1",
      category: "Security & Compliance",
      question: "Is my data secure with QPay?",
      answer: "Absolutely. We use AES-256-GCM encryption for data at rest and TLS 1.2+ for transit. We're PCI-DSS Level 1 certified, SOC 2 Type II audited, and ISO 27001 certified. All sensitive data is encrypted and tokenized.",
      tags: ["security", "encryption", "compliance"],
    },
    {
      id: "security-2",
      category: "Security & Compliance",
      question: "What compliance standards do you meet?",
      answer: "We comply with: PCI-DSS Level 1, GDPR, CCPA, AML/KYC regulations, SOC 2 Type II, ISO 27001, and regional payment regulations. We conduct regular security audits and penetration testing.",
      tags: ["compliance", "regulations", "audits"],
    },
    {
      id: "security-3",
      category: "Security & Compliance",
      question: "Do you support 2FA (Two-Factor Authentication)?",
      answer: "Yes, 2FA is mandatory for all merchant accounts and optional for customers. We support SMS, email, and authenticator app-based 2FA. API requests can use API key rotation and JWT tokens with expiration.",
      tags: ["2fa", "authentication", "security"],
    },
    {
      id: "technical-1",
      category: "Technical",
      question: "What's your API uptime SLA?",
      answer: "We guarantee 99.9% uptime SLA with automatic failover to backup regions. Our infrastructure spans 5 global data centers with redundancy. We provide detailed status page and incident notifications.",
      tags: ["api", "uptime", "infrastructure"],
    },
    {
      id: "technical-2",
      category: "Technical",
      question: "How do I integrate QPay into my platform?",
      answer: "We offer multiple integration options: REST API (detailed docs provided), pre-built plugins for WooCommerce/Shopify, payment form (embeddable), mobile SDKs (iOS/Android), and webhook support for real-time updates.",
      tags: ["integration", "api", "plugins"],
    },
    {
      id: "technical-3",
      category: "Technical",
      question: "Do you provide webhooks?",
      answer: "Yes! QPay provides webhooks for all transaction events: payment.created, payment.confirmed, payment.failed, refund.processed, dispute.opened, settlement.completed, and more. Webhooks include HMAC signatures for verification.",
      tags: ["webhooks", "events", "api"],
    },
    {
      id: "disputes-1",
      category: "Disputes & Refunds",
      question: "How do you handle chargebacks?",
      answer: "When a chargeback occurs, we notify you immediately. You can upload evidence to contest it. We manage the dispute process with the customer's bank. Disputed amounts are held during investigation. Resolution typically takes 30-45 days.",
      tags: ["chargebacks", "disputes", "refunds"],
    },
    {
      id: "disputes-2",
      category: "Disputes & Refunds",
      question: "What's your refund policy?",
      answer: "Refunds can be initiated via dashboard or API. Processing time: 1-2 business days for card refunds, same-day for crypto. Partial refunds are supported. Refund eligibility depends on transaction state (confirmed vs. settled).",
      tags: ["refunds", "returns", "policy"],
    },
    {
      id: "fraud-1",
      category: "Fraud & Risk",
      question: "How does QPay detect fraud?",
      answer: "We use AI-powered fraud detection analyzing: transaction patterns, geolocation velocity, device risk scores, IP reputation, and machine learning models. Suspicious transactions are flagged automatically. You can customize risk thresholds.",
      tags: ["fraud", "detection", "ai", "risk"],
    },
    {
      id: "fraud-2",
      category: "Fraud & Risk",
      question: "Can I set custom fraud rules?",
      answer: "Yes! Enterprise plans allow custom fraud rules: velocity limits, geographic restrictions, amount thresholds, and whitelist/blacklist management. Rules can be adjusted in real-time via dashboard or API.",
      tags: ["fraud", "rules", "configuration"],
    },
    {
      id: "support-1",
      category: "Support",
      question: "How can I contact support?",
      answer: "Support available via: 24/7 live chat, email (support@qpay.io), phone (+1-800-QPAY-101), and community forum. Response times: <30 mins for urgent issues, <2 hours for standard, <24 hours for non-urgent.",
      tags: ["support", "contact", "help"],
    },
    {
      id: "support-2",
      category: "Support",
      question: "Is documentation available?",
      answer: "Complete documentation includes: API reference, integration guides, SDKs (Node.js, Python, Go, Ruby), code samples, and video tutorials. Everything is available in our Docs section or at docs.qpay.io.",
      tags: ["documentation", "guides", "api"],
    },
    {
      id: "support-3",
      category: "Support",
      question: "Do you have a developer community?",
      answer: "Yes! Join our community forum, GitHub discussions, and Slack workspace. Get help from other developers, share integrations, and stay updated on new features. Community members can become QPay partners.",
      tags: ["community", "developers", "support"],
    },
  ];

  const categories = ["all", ...Array.from(new Set(faqs.map(f => f.category)))];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600 mb-8">
            Can't find what you're looking for? <a href="/contact" className="text-blue-600 hover:underline">Contact our support team</a>
          </p>

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category === "all" ? "All Topics" : category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">No FAQs found matching your search.</p>
              <p className="text-gray-500">Try different keywords or browse all categories.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map(faq => (
                <div
                  key={faq.id}
                  className="border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex justify-between items-start hover:bg-blue-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{faq.question}</h3>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {faq.tags.map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {expandedId === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                    )}
                  </button>

                  {expandedId === faq.id && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-blue-50">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-8">
            Our support team is ready to help 24/7
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/contact"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Contact Support
            </a>
            <a
              href="/docs"
              className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              View Documentation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
