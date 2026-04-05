import { useState } from "react";
import Header from "@/components/Header";
import { Mail, Phone, MapPin, MessageSquare, CheckCircle, AlertCircle, Loader } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "general",
    message: "",
    preferredContact: "email",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.subject) newErrors.subject = "Please select a subject";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    else if (formData.message.length < 10) newErrors.message = "Message must be at least 10 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setStatus("loading");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, send to email service
      console.log("Form submitted:", formData);

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        subject: "general",
        message: "",
        preferredContact: "email",
      });

      // Auto-reset success message after 5 seconds
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      setStatus("error");
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      value: "support@qpay.io",
      description: "Response within 2 hours",
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      value: "+1 (800) QPAY-101",
      description: "24/7 available for urgent issues",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Office Location",
      value: "San Francisco, CA",
      description: "123 Payment Street, Suite 100",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat",
      value: "Available 24/7",
      description: "Click the chat widget in bottom right",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-lg text-gray-600">
            Have a question? Our team is here to help. Reach out and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-3">{info.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                <p className="text-blue-600 font-medium text-sm mb-2">{info.value}</p>
                <p className="text-gray-600 text-xs">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Acme Inc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.subject ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="integration">Integration Help</option>
                      <option value="billing">Billing Question</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="feedback">Feedback</option>
                    </select>
                    {errors.subject && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Preferred Contact Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Contact Method
                    </label>
                    <div className="space-y-2">
                      {["email", "phone", "both"].map(method => (
                        <label key={method} className="flex items-center">
                          <input
                            type="radio"
                            name="preferredContact"
                            value={method}
                            checked={formData.preferredContact === method}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700 capitalize">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us more about your inquiry..."
                      rows={5}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.message ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.message && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Status Messages */}
                  {status === "success" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Message sent successfully!</p>
                        <p className="text-sm text-green-700">We'll get back to you within 2 hours.</p>
                      </div>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-900">Failed to send message</p>
                        <p className="text-sm text-red-700">Please try again or contact us directly.</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar - Quick Info */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Business Hours */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Business Hours</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span className="font-medium">9 AM - 6 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday:</span>
                      <span className="font-medium">10 AM - 4 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday:</span>
                      <span className="font-medium">Closed</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    <strong>Note:</strong> Urgent support available 24/7 via phone
                  </p>
                </div>

                {/* Response Times */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Response Times</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-green-900">Urgent Issues</p>
                      <p className="text-xs text-gray-600">&lt; 30 minutes</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Technical Support</p>
                      <p className="text-xs text-gray-600">&lt; 2 hours</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-900">General Inquiries</p>
                      <p className="text-xs text-gray-600">&lt; 24 hours</p>
                    </div>
                  </div>
                </div>

                {/* FAQs Link */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Help</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Many common questions are answered in our FAQ section.
                  </p>
                  <a
                    href="/faq"
                    className="text-blue-600 hover:underline font-medium text-sm"
                  >
                    Browse FAQs →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Can't find what you're looking for?</h2>
          <p className="text-gray-600 mb-6">Check our documentation or join our community forum.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/docs"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              View Docs
            </a>
            <a
              href="/faq"
              className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Browse FAQs
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
