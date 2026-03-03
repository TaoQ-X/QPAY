import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  ArrowRight,
  Code,
  Shield,
  Zap,
  BookOpen,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

export default function API() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                Developer Integration
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
              Q Pay API Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Simple, powerful APIs for blockchain payments integration
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#getting-started"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight size={18} />
              </a>
              <Link
                to="/"
                className="bg-white border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-all hover:shadow-lg"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link to="#authentication" className="bg-white rounded-lg p-6 border border-border hover:border-primary transition-all group">
              <Shield className="text-primary group-hover:scale-110 transition-transform mb-3" size={28} />
              <h3 className="font-semibold text-foreground mb-2">Authentication</h3>
              <p className="text-sm text-muted-foreground">API key & OAuth 2.0</p>
            </Link>
            <Link to="#endpoints" className="bg-white rounded-lg p-6 border border-border hover:border-primary transition-all group">
              <Code className="text-primary group-hover:scale-110 transition-transform mb-3" size={28} />
              <h3 className="font-semibold text-foreground mb-2">Endpoints</h3>
              <p className="text-sm text-muted-foreground">REST API reference</p>
            </Link>
            <Link to="#webhooks" className="bg-white rounded-lg p-6 border border-border hover:border-primary transition-all group">
              <Zap className="text-primary group-hover:scale-110 transition-transform mb-3" size={28} />
              <h3 className="font-semibold text-foreground mb-2">Webhooks</h3>
              <p className="text-sm text-muted-foreground">Event-driven updates</p>
            </Link>
            <Link to="#sdks" className="bg-white rounded-lg p-6 border border-border hover:border-primary transition-all group">
              <BookOpen className="text-primary group-hover:scale-110 transition-transform mb-3" size={28} />
              <h3 className="font-semibold text-foreground mb-2">SDKs</h3>
              <p className="text-sm text-muted-foreground">Client libraries</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section id="getting-started" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12">Getting Started</h2>

          <div className="space-y-8">
            {/* Step 1: API Key */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Generate API Key</h3>
                  <p className="text-muted-foreground mb-6">
                    Create an API key from your Q Pay dashboard. Keep it secure and never commit it to version control.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Dashboard URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground flex-1">
                        https://dashboard.qpay.io/api-keys
                      </code>
                      <button
                        onClick={() => copyToClipboard("https://dashboard.qpay.io/api-keys", "dashboard")}
                        className="p-2 hover:bg-muted rounded transition-colors"
                      >
                        {copied === "dashboard" ? (
                          <CheckCircle2 size={18} className="text-green-600" />
                        ) : (
                          <Copy size={18} className="text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Installation */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Install SDK</h3>
                  <p className="text-muted-foreground mb-6">
                    Install the Q Pay SDK for your platform:
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">JavaScript/TypeScript</p>
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 flex items-center gap-2 font-mono text-sm">
                        <span>npm install @qpay/sdk</span>
                        <button
                          onClick={() => copyToClipboard("npm install @qpay/sdk", "npm")}
                          className="ml-auto p-2 hover:bg-slate-700 rounded transition-colors"
                        >
                          {copied === "npm" ? (
                            <CheckCircle2 size={18} className="text-green-400" />
                          ) : (
                            <Copy size={18} className="text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Python</p>
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 flex items-center gap-2 font-mono text-sm">
                        <span>pip install qpay</span>
                        <button
                          onClick={() => copyToClipboard("pip install qpay", "pip")}
                          className="ml-auto p-2 hover:bg-slate-700 rounded transition-colors"
                        >
                          {copied === "pip" ? (
                            <CheckCircle2 size={18} className="text-green-400" />
                          ) : (
                            <Copy size={18} className="text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Go</p>
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 flex items-center gap-2 font-mono text-sm">
                        <span>go get github.com/qpay/go-sdk</span>
                        <button
                          onClick={() => copyToClipboard("go get github.com/qpay/go-sdk", "go")}
                          className="ml-auto p-2 hover:bg-slate-700 rounded transition-colors"
                        >
                          {copied === "go" ? (
                            <CheckCircle2 size={18} className="text-green-400" />
                          ) : (
                            <Copy size={18} className="text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Initialize */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Initialize Client</h3>
                  <p className="text-muted-foreground mb-6">
                    Initialize the Q Pay client with your API key:
                  </p>
                  <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{`import { QPay } from '@qpay/sdk';

const qpay = new QPay({
  apiKey: process.env.QPAY_API_KEY,
  environment: 'production'
});`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section id="authentication" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12">Authentication</h2>

          <div className="space-y-8">
            {/* API Key Auth */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <h3 className="text-2xl font-bold text-foreground mb-6">API Key Authentication</h3>
              <p className="text-muted-foreground mb-6">
                Include your API key in the authorization header:
              </p>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-6">
                <pre>{`curl https://api.qpay.io/v1/payments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</pre>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>⚠️ Security:</strong> Never expose your API key in client-side code. Always keep it server-side.
                </p>
              </div>
            </div>

            {/* OAuth 2.0 */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <h3 className="text-2xl font-bold text-foreground mb-6">OAuth 2.0</h3>
              <p className="text-muted-foreground mb-6">
                For user authentication, use OAuth 2.0 flow:
              </p>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`POST https://auth.qpay.io/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTH_CODE&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
redirect_uri=YOUR_REDIRECT_URI`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section id="endpoints" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12">API Endpoints</h2>

          <div className="space-y-6">
            {/* Payments */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <h3 className="text-2xl font-bold text-foreground mb-6">Payments</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 font-semibold rounded text-sm">POST</span>
                    <code className="font-mono">/v1/payments</code>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">Create a new payment</p>
                  <div className="bg-muted/50 rounded p-3 text-sm">
                    <p className="font-semibold text-foreground mb-2">Request body:</p>
                    <code className="text-xs">{"{ amount: number, currency: string, blockchain: string, recipient: string }"}</code>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold rounded text-sm">GET</span>
                    <code className="font-mono">/v1/payments/:id</code>
                  </div>
                  <p className="text-muted-foreground text-sm">Get payment status and details</p>
                </div>

                <div className="border-l-4 border-blue-500 pl-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold rounded text-sm">GET</span>
                    <code className="font-mono">/v1/payments</code>
                  </div>
                  <p className="text-muted-foreground text-sm">List all payments with pagination</p>
                </div>
              </div>
            </div>

            {/* Settlements */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <h3 className="text-2xl font-bold text-foreground mb-6">Settlements</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 font-semibold rounded text-sm">POST</span>
                    <code className="font-mono">/v1/settlements</code>
                  </div>
                  <p className="text-muted-foreground text-sm">Create settlement request</p>
                </div>

                <div className="border-l-4 border-blue-500 pl-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold rounded text-sm">GET</span>
                    <code className="font-mono">/v1/settlements/:id</code>
                  </div>
                  <p className="text-muted-foreground text-sm">Get settlement status</p>
                </div>
              </div>
            </div>

            {/* Accounts */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <h3 className="text-2xl font-bold text-foreground mb-6">Accounts</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold rounded text-sm">GET</span>
                    <code className="font-mono">/v1/accounts/me</code>
                  </div>
                  <p className="text-muted-foreground text-sm">Get current account details</p>
                </div>

                <div className="border-l-4 border-primary pl-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 font-semibold rounded text-sm">POST</span>
                    <code className="font-mono">/v1/accounts/me/wallets</code>
                  </div>
                  <p className="text-muted-foreground text-sm">Create linked wallet</p>
                </div>

                <div className="border-l-4 border-blue-500 pl-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold rounded text-sm">GET</span>
                    <code className="font-mono">/v1/accounts/me/wallets</code>
                  </div>
                  <p className="text-muted-foreground text-sm">List all linked wallets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section id="webhooks" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12">Webhooks</h2>

          <div className="space-y-8">
            <p className="text-lg text-muted-foreground max-w-2xl">
              Receive real-time notifications for payment events. Configure your webhook endpoint in the dashboard.
            </p>

            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <h3 className="text-2xl font-bold text-foreground mb-6">Webhook Events</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-6 py-4">
                  <h4 className="font-semibold text-foreground mb-2">payment.created</h4>
                  <p className="text-muted-foreground text-sm">Triggered when a new payment is created</p>
                </div>
                <div className="border-l-4 border-primary pl-6 py-4">
                  <h4 className="font-semibold text-foreground mb-2">payment.pending</h4>
                  <p className="text-muted-foreground text-sm">Payment is waiting for blockchain confirmation</p>
                </div>
                <div className="border-l-4 border-primary pl-6 py-4">
                  <h4 className="font-semibold text-foreground mb-2">payment.confirmed</h4>
                  <p className="text-muted-foreground text-sm">Payment confirmed on blockchain</p>
                </div>
                <div className="border-l-4 border-primary pl-6 py-4">
                  <h4 className="font-semibold text-foreground mb-2">payment.failed</h4>
                  <p className="text-muted-foreground text-sm">Payment failed or rejected</p>
                </div>
                <div className="border-l-4 border-primary pl-6 py-4">
                  <h4 className="font-semibold text-foreground mb-2">settlement.completed</h4>
                  <p className="text-muted-foreground text-sm">Settlement to bank account completed</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
              <h3 className="text-2xl font-bold text-foreground mb-6">Webhook Payload Example</h3>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`{
  "id": "evt_1234567890",
  "type": "payment.confirmed",
  "timestamp": 1640000000,
  "data": {
    "paymentId": "pay_abc123",
    "amount": 1000,
    "currency": "USD",
    "status": "confirmed",
    "txHash": "0x1234..."
  }
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section id="sdks" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12">Client Libraries & SDKs</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-border p-8 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">JS</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">JavaScript/TypeScript</h3>
                  <p className="text-sm text-muted-foreground">Node.js & Browser</p>
                </div>
              </div>
              <a href="#" className="text-primary font-semibold hover:underline">
                npm @qpay/sdk →
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-border p-8 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">🐍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Python</h3>
                  <p className="text-sm text-muted-foreground">3.7+</p>
                </div>
              </div>
              <a href="#" className="text-primary font-semibold hover:underline">
                pip qpay →
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-border p-8 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">Go</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Go</h3>
                  <p className="text-sm text-muted-foreground">1.16+</p>
                </div>
              </div>
              <a href="#" className="text-primary font-semibold hover:underline">
                go-sdk →
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-border p-8 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">☕</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Java</h3>
                  <p className="text-sm text-muted-foreground">11+</p>
                </div>
              </div>
              <a href="#" className="text-primary font-semibold hover:underline">
                qpay-java →
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-border p-8 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">♦</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Ruby</h3>
                  <p className="text-sm text-muted-foreground">2.7+</p>
                </div>
              </div>
              <a href="#" className="text-primary font-semibold hover:underline">
                qpay-ruby →
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-border p-8 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">PHP</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">PHP</h3>
                  <p className="text-sm text-muted-foreground">7.4+</p>
                </div>
              </div>
              <a href="#" className="text-primary font-semibold hover:underline">
                qpay-php →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Need More Help?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Check out our comprehensive guides, community forum, and support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                Back to Home <ArrowRight size={18} />
              </Link>
              <a
                href="mailto:support@qpay.io"
                className="bg-white border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-all hover:shadow-lg"
              >
                Contact Support
              </a>
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
                <span className="font-bold text-foreground">Q Pay</span>
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
                  <Link to="/" className="text-muted-foreground hover:text-primary">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Developers</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/api" className="text-muted-foreground hover:text-primary">
                    API Reference
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@qpay.io" className="text-muted-foreground hover:text-primary">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <p className="text-center text-muted-foreground text-sm">
              © 2024 Q Pay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
