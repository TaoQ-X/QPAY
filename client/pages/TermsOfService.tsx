import Header from "@/components/Header";
import { FileText, AlertTriangle, Scale, Shield, DollarSign } from "lucide-react";

export default function TermsOfService() {
  const sections = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "1. Service Description",
      content: "QPay provides a blockchain-based payment processing platform that enables merchants to accept cryptocurrency and fiat payments. Our services include transaction processing, settlement to bank accounts, fraud detection, reporting, webhooks, and API access.",
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: "2. Eligibility & Account Registration",
      content: "You must be at least 18 years old and have legal capacity to enter into contracts. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "3. Fees & Pricing",
      content: "Transaction fees, monthly fees, and settlement fees are detailed in your merchant agreement. We reserve the right to change fees with 30 days' notice. You will be notified of changes via email and dashboard notice.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "4. Acceptable Use Policy",
      content: "You agree NOT to: use the service for illegal activities, fraud, money laundering, terrorism financing; transmit viruses or malicious code; reverse-engineer or attempt to breach our systems; use automated tools without permission; facilitate gambling, adult content, or weapons sales.",
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: "5. Compliance & Regulatory",
      content: "You agree to comply with all applicable laws including AML/KYC requirements. We may request additional documentation for verification. We reserve the right to suspend accounts that fail compliance checks or appear to violate regulations.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600">
            These terms govern your use of QPay's payment processing platform.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Important Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-12">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-red-900 mb-2">Please Read Carefully</h2>
                <p className="text-red-800">
                  By accessing and using QPay, you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>
            </div>
          </div>

          {/* Main Sections */}
          <div className="space-y-8 mb-12">
            {sections.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-600 pl-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-blue-600">{section.icon}</div>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <p className="text-gray-700">{section.content}</p>
              </div>
            ))}
          </div>

          {/* More Sections */}
          <div className="space-y-8">
            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Intellectual Property Rights</h2>
              <p className="text-gray-700 mb-3">
                All content, features, and functionality of QPay (including software, code, design) are owned by QPay and are protected by copyright and other intellectual property laws.
              </p>
              <p className="text-gray-700">
                You receive a limited license to use QPay for your personal or business purposes. You may not modify, reproduce, or distribute any content without prior written consent.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700 mb-3">
                TO THE FULLEST EXTENT PERMITTED BY LAW, QPAY SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Indirect, incidental, special, or consequential damages</li>
                <li>• Loss of profits, revenue, data, or business opportunities</li>
                <li>• Cryptocurrency market fluctuations</li>
                <li>• Third-party actions or failures</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Our total liability is limited to the fees you paid in the 12 months preceding the claim.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Disclaimers</h2>
              <p className="text-gray-700 mb-3">
                QPay is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• We do not guarantee uninterrupted service (99.9% SLA applies)</li>
                <li>• We do not warrant accuracy of transaction data</li>
                <li>• We do not control cryptocurrency network delays</li>
                <li>• We are not responsible for third-party services</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify, defend, and hold harmless QPay from any claims, damages, or costs arising from:
              </p>
              <ul className="text-gray-700 space-y-2 mt-3">
                <li>• Your violation of these terms</li>
                <li>• Your violation of applicable laws</li>
                <li>• Your use of QPay services</li>
                <li>• Your transactions processed through QPay</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Termination</h2>
              <p className="text-gray-700 mb-3">
                We may terminate your account if you:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Violate these terms of service</li>
                <li>• Engage in illegal activities</li>
                <li>• Fail compliance requirements</li>
                <li>• Exceed chargebacks or fraud thresholds</li>
              </ul>
              <p className="text-gray-700 mt-3">
                You may terminate your account anytime by request. Outstanding balances remain due.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Dispute Resolution</h2>
              <p className="text-gray-700 mb-3">
                Any disputes arising from these terms or your use of QPay shall be resolved through:
              </p>
              <ol className="text-gray-700 space-y-2 list-decimal list-inside">
                <li>Good faith negotiation between parties</li>
                <li>Mediation (if negotiation fails)</li>
                <li>Binding arbitration under UNCITRAL rules</li>
                <li>Venue: San Francisco, California</li>
              </ol>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Cryptocurrency Disclaimer</h2>
              <p className="text-gray-700 mb-3">
                IMPORTANT: Cryptocurrency transactions are irreversible. You acknowledge:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Crypto market volatility and price fluctuations</li>
                <li>• Transaction delays on blockchain networks</li>
                <li>• Regulatory uncertainty in various jurisdictions</li>
                <li>• Risk of total loss of cryptocurrency value</li>
              </ul>
              <p className="text-gray-700 mt-3">
                QPay is not responsible for losses due to market conditions or blockchain delays.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. Material changes will be communicated 30 days in advance. 
                Continued use after notification constitutes acceptance of the updated terms.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">14. Contact Information</h2>
              <p className="text-gray-700 mb-3">
                For questions about these terms:
              </p>
              <div className="bg-gray-50 p-4 rounded text-sm text-gray-700">
                <p><strong>Email:</strong> legal@qpay.io</p>
                <p><strong>Address:</strong> QPay Inc., 123 Payment Street, San Francisco, CA 94102</p>
                <p><strong>Phone:</strong> +1 (800) QPAY-101</p>
              </div>
            </div>
          </div>

          {/* Acceptance Checkbox */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Acknowledgment</h3>
            <p className="text-gray-700">
              By creating an account with QPay or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
