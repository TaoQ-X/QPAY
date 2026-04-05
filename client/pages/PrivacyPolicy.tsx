import Header from "@/components/Header";
import { Shield, Lock, Eye, Users, Database, AlertCircle } from "lucide-react";

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: <Database className="w-6 h-6" />,
      title: "1. Information We Collect",
      content: [
        "Personal information: name, email, phone number, address",
        "Business information: company name, VAT number, business type",
        "Financial information: bank account details (encrypted), transaction history",
        "Technical information: IP address, browser type, device information",
        "Payment data: processed through secure PCI-DSS compliant systems",
      ],
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "2. How We Use Your Information",
      content: [
        "Processing and settling transactions",
        "Fraud detection and prevention",
        "KYC/AML compliance verification",
        "Improving our services and user experience",
        "Customer support and communication",
        "Legal and regulatory compliance",
        "Marketing and promotional communications (with consent)",
      ],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "3. Data Security & Encryption",
      content: [
        "AES-256-GCM encryption for sensitive data at rest",
        "TLS 1.2+ encryption for data in transit",
        "PCI-DSS Level 1 compliance",
        "Regular security audits and penetration testing",
        "Multi-factor authentication (2FA) support",
        "Encrypted backup with point-in-time recovery",
        "Access logs and audit trails for all operations",
      ],
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "4. Data Sharing & Third Parties",
      content: [
        "We do NOT sell your personal data",
        "Sharing only with: payment processors, banks, and regulatory bodies",
        "All partners have signed Data Processing Agreements (DPA)",
        "International transfers comply with GDPR adequacy decisions",
        "You can request a list of all parties with access to your data",
      ],
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "5. Your Rights (GDPR & CCPA)",
      content: [
        "Right to access: Get a copy of your personal data",
        "Right to correction: Update inaccurate information",
        "Right to erasure: Delete your data (subject to legal requirements)",
        "Right to portability: Export your data in standard format",
        "Right to object: Opt-out of certain processing activities",
        "Right to restriction: Limit how we use your data",
        "Right to withdraw consent: Stop communications anytime",
      ],
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: "6. Data Retention",
      content: [
        "Transaction records: 7 years (legal requirement)",
        "Personal information: Until account closure + 2 years",
        "Marketing emails: Until unsubscribe",
        "Support tickets: 2 years after resolution",
        "Fraud detection data: 3 years for pattern analysis",
        "Backup copies: Deleted after retention period",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            At QPay, we are committed to protecting your privacy and ensuring transparency about how we handle your data.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy at a Glance</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✓ We Protect</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Your financial information with military-grade encryption</li>
                  <li>• Personal data with strict access controls</li>
                  <li>• Your privacy with transparent policies</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✗ We Don't</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Sell your personal data to third parties</li>
                  <li>• Share data without legal basis</li>
                  <li>• Use dark patterns to trick you</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-8 mb-16">
            {sections.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-600 pl-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-blue-600">{section.icon}</div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-2 text-gray-700">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">7. Contact Us</h3>
              <p className="text-gray-700 mb-3">
                For privacy inquiries or to exercise your rights:
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Email:</strong> privacy@qpay.io</p>
                <p><strong>Data Protection Officer:</strong> dpo@qpay.io</p>
                <p><strong>Mailing Address:</strong><br/>QPay Inc.<br/>Data Protection Team<br/>123 Payment Street<br/>San Francisco, CA 94102</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">8. Compliance Standards</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">GDPR (EU)</span>
                  <span className="text-green-600 font-semibold">✓ Compliant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">CCPA (California)</span>
                  <span className="text-green-600 font-semibold">✓ Compliant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">PCI-DSS Level 1</span>
                  <span className="text-green-600 font-semibold">✓ Certified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">SOC 2 Type II</span>
                  <span className="text-green-600 font-semibold">✓ Audited</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">ISO 27001</span>
                  <span className="text-green-600 font-semibold">✓ Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cookies Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-12">
            <h3 className="text-lg font-bold text-gray-900 mb-3">9. Cookies & Tracking</h3>
            <p className="text-gray-700 mb-3">
              We use cookies to improve your experience. You can control cookies through your browser settings.
            </p>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Essential:</strong> Login, security, fraud prevention (necessary)</p>
              <p><strong>Analytics:</strong> Google Analytics (optional)</p>
              <p><strong>Marketing:</strong> Retargeting pixels (optional)</p>
            </div>
          </div>

          {/* Policy Changes */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-3">10. Policy Updates</h3>
            <p className="text-gray-700">
              We may update this policy periodically. Material changes will be communicated via email or prominent notice on our website. 
              Continued use of our services indicates acceptance of the updated policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
