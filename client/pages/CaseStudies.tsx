import Header from "@/components/Header";
import { Star, TrendingUp, Users, DollarSign, ArrowRight } from "lucide-react";

interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  logo: string;
  challenge: string;
  solution: string;
  results: { metric: string; value: string; improvement: string }[];
  testimonial: string;
  author: string;
  role: string;
  image: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  text: string;
  rating: number;
  image: string;
}

export default function CaseStudies() {
  const caseStudies: CaseStudy[] = [
    {
      id: "1",
      company: "TechFlow Commerce",
      industry: "E-Commerce",
      logo: "TFC",
      challenge:
        "Processing international payments with high fees and complex integrations. Losing 15% of customers due to payment failures and limited payment methods.",
      solution:
        "Migrated to QPay's multi-currency payment platform with local payment methods. Integrated webhooks for real-time order updates and fraud detection.",
      results: [
        {
          metric: "Transaction Success Rate",
          value: "99.8%",
          improvement: "+18% from 81.8%",
        },
        {
          metric: "Payment Processing Fees",
          value: "1.8%",
          improvement: "-35% savings annually",
        },
        {
          metric: "International Customers",
          value: "+45%",
          improvement: "New markets enabled",
        },
        {
          metric: "Time to Process",
          value: "<2 sec",
          improvement: "-1.5 sec faster",
        },
      ],
      testimonial:
        "QPay transformed our payment operations. We went from supporting 5 currencies to 47, cut our processing costs by 35%, and increased our conversion rate significantly. Their fraud detection is outstanding.",
      author: "Sarah Chen",
      role: "CTO",
      image: "👩‍💼",
    },
    {
      id: "2",
      company: "SubscribeHub",
      industry: "SaaS",
      logo: "SH",
      challenge:
        "Managing recurring billing for 50K+ subscribers with high churn due to failed payment processing. Complex refund requests and customer support overhead.",
      solution:
        "Implemented QPay's subscription management with intelligent retry logic, automated dunning, and comprehensive webhooks for customer lifecycle management.",
      results: [
        {
          metric: "Failed Payment Recovery",
          value: "87%",
          improvement: "+42% from 45%",
        },
        {
          metric: "Customer Churn",
          value: "-8.5%",
          improvement: "Improved retention by 8.5%",
        },
        {
          metric: "MRR Growth",
          value: "$125K/month",
          improvement: "+$35K from saved renewals",
        },
        {
          metric: "Support Tickets",
          value: "-40%",
          improvement: "Automated billing reduced inquiries",
        },
      ],
      testimonial:
        "The subscription features are incredibly comprehensive. Our MRR grew by 35K in 3 months just from improving payment recovery. The AI recommendations helped us optimize our pricing too.",
      author: "Marcus Johnson",
      role: "Product Manager",
      image: "👨‍💼",
    },
    {
      id: "3",
      company: "GlobalMarket Sellers",
      industry: "Marketplace",
      logo: "GMS",
      challenge:
        "Processing payments for 10K+ sellers across 30+ countries. Complex settlement requirements, high fraud rates, and compliance challenges.",
      solution:
        "Deployed QPay's marketplace API with advanced fraud detection, multi-currency settlement, and automated seller onboarding with KYC/AML verification.",
      results: [
        {
          metric: "Fraud Prevention",
          value: "98.5%",
          improvement: "+28% fewer fraudulent transactions",
        },
        {
          metric: "Seller Onboarding",
          value: "< 2 hours",
          improvement: "Was 2 days, now automated",
        },
        {
          metric: "Settlement Volume",
          value: "$2.5M/day",
          improvement: "365 day operational uptime",
        },
        {
          metric: "Compliance Audits",
          value: "100% Pass",
          improvement: "Full PCI-DSS & GDPR compliance",
        },
      ],
      testimonial:
        "QPay's scalability is impressive. We handle 2.5M in daily settlements with zero compliance issues. Their fraud detection is AI-powered and catches patterns our internal teams missed.",
      author: "Rajesh Patel",
      role: "VP Operations",
      image: "👨‍💼",
    },
  ];

  const testimonials: Testimonial[] = [
    {
      id: "1",
      name: "Emily Rodriguez",
      role: "Founder",
      company: "Digital Store Co",
      text: "QPay made our international expansion possible. Within a month, we were processing payments in 15 new countries. The support team is incredibly responsive.",
      rating: 5,
      image: "👩‍🎨",
    },
    {
      id: "2",
      name: "Alex Thompson",
      role: "Finance Director",
      company: "Fashion Retail Group",
      text: "We saved $150K annually by switching to QPay. Their fraud detection is so accurate that our chargeback rate dropped by 60%. Best decision we made this year.",
      rating: 5,
      image: "👨‍💼",
    },
    {
      id: "3",
      name: "Lisa Wong",
      role: "Dev Lead",
      company: "Tech Startup Inc",
      text: "The API documentation is excellent and the integration took only 2 days. Webhooks work perfectly. We're processing 50K transactions/day without any issues.",
      rating: 5,
      image: "👩‍💻",
    },
    {
      id: "4",
      name: "Carlos Mendez",
      role: "CEO",
      company: "Payment Solutions Ltd",
      text: "QPay's reliability is unmatched. 99.95% uptime, global infrastructure, and enterprise-grade security. Our customers love the fast settlements.",
      rating: 5,
      image: "👨‍🏫",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h1>
          <p className="text-lg text-gray-600">
            See how industry leaders are scaling with QPay
          </p>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {caseStudies.map((study, index) => (
            <div
              key={study.id}
              className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? "lg:grid-flow-dense" : ""}`}
            >
              {/* Content */}
              <div>
                <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {study.industry}
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-6">{study.company}</h2>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">The Challenge</h3>
                  <p className="text-gray-700 leading-relaxed">{study.challenge}</p>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">The Solution</h3>
                  <p className="text-gray-700 leading-relaxed">{study.solution}</p>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {study.results.map((result, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">{result.metric}</p>
                      <p className="text-2xl font-bold text-blue-600 mb-1">{result.value}</p>
                      <p className="text-xs text-green-600 font-medium">{result.improvement}</p>
                    </div>
                  ))}
                </div>

                {/* Testimonial Quote */}
                <div className="bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
                  <p className="text-gray-700 italic mb-4">"{study.testimonial}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{study.author}</p>
                    <p className="text-sm text-gray-600">{study.role}, {study.company}</p>
                  </div>
                </div>
              </div>

              {/* Visual */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-12 text-center">
                <div className="text-7xl mb-6">{study.image}</div>
                <div className="space-y-4">
                  {study.results.slice(0, 2).map((result, i) => (
                    <div key={i} className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">{result.metric}</span>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{result.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of merchants and platforms trusted by industry leaders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
                {/* Stars */}
                <div className="flex gap-1 mb-3">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 mb-4 line-clamp-4">"{testimonial.text}"</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{testimonial.image}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2000+</div>
              <p className="text-gray-600">Active Merchants</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">$2.5B+</div>
              <p className="text-gray-600">Processed Annually</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">47</div>
              <p className="text-gray-600">Supported Currencies</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <p className="text-gray-600">Uptime SLA</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Join These Success Stories?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how QPay can transform your payment operations
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/register/sme"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/contact"
              className="bg-white border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Schedule Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
