import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { CheckCircle, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterSME() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Business Info
    name: "",
    type: "sme" as const,
    email: "",
    phone: "",
    website: "",
    description: "",
    industry: "",
    country: "US",
    region: "",
    companySize: "small" as "small" | "medium" | "large",
    isIsraeli: false,

    // Settlement
    settlement_currency: "USD",
    settlement_frequency: "daily" as const,
    payment_methods: [] as string[],

    // Contact
    full_name: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/register-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Failed to register business. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <CheckCircle className="w-16 h-16 text-accent mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Registration Complete!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Your SME business account has been created successfully. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step >= num
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {num}
                  </div>
                  {num < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-all ${
                        step > num ? "bg-primary" : "bg-muted"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm">
              <span className={step === 1 ? "text-primary font-semibold" : "text-muted-foreground"}>
                Business Info
              </span>
              <span className={step === 2 ? "text-primary font-semibold" : "text-muted-foreground"}>
                Settlement Setup
              </span>
              <span className={step === 3 ? "text-primary font-semibold" : "text-muted-foreground"}>
                Contact Info
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Step 1: Business Info */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Tell us about your business
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your business name"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Industry
                    </label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select industry</option>
                      <option value="Retail">Retail</option>
                      <option value="SaaS">SaaS</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Services">Services</option>
                      <option value="Technology">Technology</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData((prev) => ({
                          ...prev,
                          isIsraeli: e.target.value === "IL",
                        }));
                      }}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="IL">🇮🇱 Israel</option>
                      <option value="SG">Singapore</option>
                      <option value="JP">Japan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Size
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="small">Small (1-50 employees)</option>
                      <option value="medium">Medium (51-500 employees)</option>
                      <option value="large">Large (500+ employees)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Business Description (optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell us what your business does"
                      rows={3}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Settlement Setup */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Settlement preferences
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Settlement Currency
                    </label>
                    <select
                      name="settlement_currency"
                      value={formData.settlement_currency}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="ILS">ILS - Israeli Shekel</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="SGD">SGD - Singapore Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Settlement Frequency
                    </label>
                    <select
                      name="settlement_frequency"
                      value={formData.settlement_frequency}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Payment Methods */}
                {formData.isIsraeli && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Israeli Payment Methods
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          name="payment_methods"
                          value="bank_transfer"
                          checked={formData.payment_methods.includes("bank_transfer")}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              payment_methods: e.target.checked
                                ? [...prev.payment_methods, value]
                                : prev.payment_methods.filter((m) => m !== value),
                            }));
                          }}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-foreground">Bank Transfer (תשלום בהעברה בנקאית)</p>
                          <p className="text-xs text-muted-foreground">Bank of Israel, Leumi, Hapoalim</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          name="payment_methods"
                          value="bit"
                          checked={formData.payment_methods.includes("bit")}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              payment_methods: e.target.checked
                                ? [...prev.payment_methods, value]
                                : prev.payment_methods.filter((m) => m !== value),
                            }));
                          }}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-foreground">Bit Payment (ביט)</p>
                          <p className="text-xs text-muted-foreground">Israeli mobile payment system</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          name="payment_methods"
                          value="credit_card"
                          checked={formData.payment_methods.includes("credit_card")}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              payment_methods: e.target.checked
                                ? [...prev.payment_methods, value]
                                : prev.payment_methods.filter((m) => m !== value),
                            }));
                          }}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-foreground">Credit/Debit Card (כרטיס אשראי)</p>
                          <p className="text-xs text-muted-foreground">Visa, MasterCard, American Express</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          name="payment_methods"
                          value="crypto"
                          checked={formData.payment_methods.includes("crypto")}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              payment_methods: e.target.checked
                                ? [...prev.payment_methods, value]
                                : prev.payment_methods.filter((m) => m !== value),
                            }));
                          }}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-foreground">Cryptocurrency (קריפטוגרפיה)</p>
                          <p className="text-xs text-muted-foreground">Bitcoin, Ethereum, USDC</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Plan Details Based on Company Size */}
                <div className={`rounded-lg p-4 border-2 ${
                  formData.companySize === "small"
                    ? "bg-blue-50 border-blue-300"
                    : formData.companySize === "medium"
                    ? "bg-green-50 border-green-300"
                    : "bg-purple-50 border-purple-300"
                }`}>
                  <h3 className="font-semibold text-foreground mb-3">
                    {formData.companySize === "small"
                      ? "📈 Growth Plan (Startup/Small)"
                      : formData.companySize === "medium"
                      ? "🚀 Professional Plan (Medium)"
                      : "💼 Enterprise Plan (Large)"}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {formData.companySize === "small" ? (
                      <>
                        <li>✓ 2.5% transaction fee (0% on crypto)</li>
                        <li>✓ Up to $25,000 monthly volume</li>
                        <li>✓ 24/7 email support</li>
                        <li>✓ Basic analytics & reporting</li>
                        <li>✓ Multi-currency settlement</li>
                        <li>✓ Zero fees on international transfers</li>
                      </>
                    ) : formData.companySize === "medium" ? (
                      <>
                        <li>✓ 1.5% transaction fee (0% on crypto)</li>
                        <li>✓ Unlimited monthly volume</li>
                        <li>✓ Priority phone & email support</li>
                        <li>✓ Advanced analytics & insights</li>
                        <li>✓ Multi-currency settlement</li>
                        <li>✓ Webhook integrations</li>
                        <li>✓ Dedicated account manager</li>
                      </>
                    ) : (
                      <>
                        <li>✓ Custom rates (starting 0.5%)</li>
                        <li>✓ Unlimited monthly volume</li>
                        <li>✓ 24/7 priority support</li>
                        <li>✓ Real-time analytics & AI insights</li>
                        <li>✓ Custom payment solutions</li>
                        <li>✓ Multi-currency & crypto settlement</li>
                        <li>✓ Dedicated technical team</li>
                        <li>✓ White-label solutions</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3: Contact Info */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Contact information
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Website (optional)
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    What happens next?
                  </h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Your account will be created</li>
                    <li>Verify your email address</li>
                    <li>Start accepting crypto payments</li>
                    <li>Get verified through KYC (24-48 hours)</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-border">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 transition-all"
              >
                Previous
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Complete Registration"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
