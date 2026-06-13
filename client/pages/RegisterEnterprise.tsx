import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { CheckCircle, ArrowRight, AlertCircle, Shield } from "lucide-react";

export default function RegisterEnterprise() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Business Info
    name: "",
    type: "enterprise" as const,
    email: "",
    phone: "",
    website: "",
    description: "",
    industry: "",
    country: "US",
    region: "",

    // Settlement
    settlement_currency: "USD",
    settlement_frequency: "daily" as const,

    // Contact
    full_name: "",

    // Enterprise specific
    company_size: "",
    annual_volume: "",
    compliance_contact: "",
    technical_contact: "",
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

    // Validate required fields
    if (!formData.name || formData.name.length < 2) {
      setError("Business name is required (minimum 2 characters)");
      setLoading(false);
      return;
    }

    if (!formData.email) {
      setError("Email address is required");
      setLoading(false);
      return;
    }

    if (!formData.industry) {
      setError("Industry is required");
      setLoading(false);
      return;
    }

    if (!formData.full_name || formData.full_name.length < 2) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    try {
      const requestBody = {
        name: formData.name,
        type: formData.type,
        email: formData.email,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        description: formData.description || undefined,
        industry: formData.industry,
        country: formData.country || "US",
        region: formData.region || undefined,
        settlement_currency: formData.settlement_currency || "USD",
        settlement_frequency: formData.settlement_frequency || "daily",
        full_name: formData.full_name,
      };

      // Remove undefined values
      Object.keys(requestBody).forEach((key) => {
        if ((requestBody as any)[key] === undefined) {
          delete (requestBody as any)[key];
        }
      });

      const response = await fetch("/api/register-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse response:", responseText);
        setError("Server error. Please try again later.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
          data.errors?.[0]?.message ||
          `Error: ${response.status}`
        );
        setLoading(false);
        return;
      }

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register business. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
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
              Enterprise Account Created!
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Your enterprise account has been set up. A dedicated account manager will contact you within 24 hours.
            </p>
            <p className="text-muted-foreground">
              Redirecting to dashboard...
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
        <div className="max-w-3xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      step >= num
                        ? "bg-secondary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {num}
                  </div>
                  {num < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-all ${
                        step > num ? "bg-secondary" : "bg-muted"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <span className={step === 1 ? "text-secondary font-semibold" : "text-muted-foreground"}>
                Company
              </span>
              <span className={step === 2 ? "text-secondary font-semibold" : "text-muted-foreground"}>
                Details
              </span>
              <span className={step === 3 ? "text-secondary font-semibold" : "text-muted-foreground"}>
                Contacts
              </span>
              <span className={step === 4 ? "text-secondary font-semibold" : "text-muted-foreground"}>
                Review
              </span>
            </div>
          </div>

          {/* Enterprise Badge */}
          <div className="mb-8 p-4 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center gap-3">
            <Shield className="w-5 h-5 text-secondary flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Enterprise Plan</h3>
              <p className="text-sm text-muted-foreground">
                Dedicated account manager, advanced security, and custom integrations
              </p>
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

            {/* Step 1: Company Info */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Company information
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your company name"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
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
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    >
                      <option value="">Select industry</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="SaaS">SaaS</option>
                      <option value="Technology">Technology</option>
                      <option value="Marketplace">Marketplace</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Size
                    </label>
                    <select
                      name="company_size"
                      value={formData.company_size}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    >
                      <option value="">Select size</option>
                      <option value="100-500">100-500 employees</option>
                      <option value="500-1000">500-1,000 employees</option>
                      <option value="1000+">1,000+ employees</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="SG">Singapore</option>
                      <option value="JP">Japan</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Business details
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Annual Transaction Volume (USD)
                    </label>
                    <select
                      name="annual_volume"
                      value={formData.annual_volume}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    >
                      <option value="">Select volume</option>
                      <option value="1-5m">$1M - $5M</option>
                      <option value="5-25m">$5M - $25M</option>
                      <option value="25-100m">$25M - $100M</option>
                      <option value="100m+">$100M+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Settlement Currency
                    </label>
                    <select
                      name="settlement_currency"
                      value={formData.settlement_currency}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="SGD">SGD</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell us about your business and payment needs"
                      rows={4}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    ></textarea>
                  </div>
                </div>

                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    Enterprise Plan Includes
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Custom transaction fees (volume-based)</li>
                    <li>✓ Unlimited monthly volume</li>
                    <li>✓ Dedicated account manager</li>
                    <li>✓ Priority 24/7 support</li>
                    <li>✓ Advanced analytics & reporting</li>
                    <li>✓ Custom API integrations</li>
                    <li>✓ White-label solutions available</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Contact information
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Primary Contact Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Full name"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Business Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="business@company.com"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Compliance Contact Email
                    </label>
                    <input
                      type="email"
                      name="compliance_contact"
                      value={formData.compliance_contact}
                      onChange={handleChange}
                      placeholder="compliance@company.com"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Technical Contact Email
                    </label>
                    <input
                      type="email"
                      name="technical_contact"
                      value={formData.technical_contact}
                      onChange={handleChange}
                      placeholder="tech@company.com"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Review your information
                </h2>

                <div className="space-y-4 bg-muted/50 border border-border rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="font-semibold text-foreground">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-semibold text-foreground">{formData.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Primary Contact</p>
                      <p className="font-semibold text-foreground">{formData.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold text-foreground">{formData.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    Next steps after signup
                  </h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Your enterprise account will be created</li>
                    <li>Dedicated account manager will contact you within 24 hours</li>
                    <li>Custom pricing and integration planning</li>
                    <li>Deploy and start accepting payments</li>
                  </ol>
                </div>

                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    By registering, you agree to our Terms of Service and Privacy Policy.
                    We'll treat your data securely and never share it without permission.
                  </p>
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

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Create Enterprise Account"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
