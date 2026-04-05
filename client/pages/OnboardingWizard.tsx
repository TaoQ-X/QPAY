import { useState, FormEvent } from "react";
import { CheckCircle, AlertCircle, Upload, Key, Building2, Users } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: 1, title: "Welcome", description: "Get started with QPay", icon: <Users className="w-8 h-8" /> },
  { id: 2, title: "KYC Verification", description: "Verify your identity", icon: <CheckCircle className="w-8 h-8" /> },
  { id: 3, title: "Bank Account", description: "Link your bank account", icon: <Building2 className="w-8 h-8" /> },
  { id: 4, title: "API Keys", description: "Generate API credentials", icon: <Key className="w-8 h-8" /> },
  { id: 5, title: "Complete", description: "All set!", icon: <CheckCircle className="w-8 h-8" /> },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    businessType: "",
    businessAddress: "",
    documentType: "passport",
    documentFile: null as File | null,
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    apiKeyName: "",
    apiDescription: "",
  });
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [apiKey, setApiKey] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, documentFile: "Only PDF, JPG, PNG files allowed" }));
        return;
      }
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, documentFile: "File size must be less than 10MB" }));
        return;
      }
      
      setFormData(prev => ({ ...prev, documentFile: file }));
      setErrors(prev => ({ ...prev, documentFile: "" }));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch(currentStep) {
      case 1:
        if (!formData.companyName.trim()) newErrors.companyName = "Company name required";
        if (!formData.email.trim()) newErrors.email = "Email required";
        if (!formData.businessType) newErrors.businessType = "Business type required";
        if (!formData.businessAddress.trim()) newErrors.businessAddress = "Address required";
        break;
      case 2:
        if (!formData.documentFile) newErrors.documentFile = "Document required";
        break;
      case 3:
        if (!formData.accountHolderName.trim()) newErrors.accountHolderName = "Account holder name required";
        if (!formData.accountNumber.trim()) newErrors.accountNumber = "Account number required";
        if (!formData.bankName.trim()) newErrors.bankName = "Bank name required";
        break;
      case 4:
        if (!formData.apiKeyName.trim()) newErrors.apiKeyName = "API key name required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === 4) {
        // Generate API key
        const newApiKey = `sk_live_${Math.random().toString(36).substr(2, 32)}`;
        setApiKey(newApiKey);
      }
      
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to QPay</h1>
          <p className="text-gray-600">Complete your setup in just a few minutes</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                    completedSteps.includes(step.id)
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                      ? "bg-blue-600 text-white ring-4 ring-blue-200"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="font-semibold">{step.id}</span>
                  )}
                </div>
                <span className={`text-xs font-medium text-center ${
                  currentStep >= step.id ? "text-gray-900" : "text-gray-500"
                }`}>
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block h-1 w-full mx-1 mt-3 ${
                      completedSteps.includes(step.id) ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Company Information</h2>
                <p className="text-gray-600 mb-6">Tell us about your business</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Your company name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.companyName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.businessType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a type...</option>
                  <option value="sole">Sole Proprietor</option>
                  <option value="llc">LLC</option>
                  <option value="corp">Corporation</option>
                  <option value="nonprofit">Non-profit</option>
                </select>
                {errors.businessType && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.businessType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  placeholder="Full business address"
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.businessAddress ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.businessAddress && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.businessAddress}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: KYC Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 2: Identity Verification</h2>
                <p className="text-gray-600 mb-4">Upload a government-issued ID for verification</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="passport">Passport</option>
                  <option value="license">Driver's License</option>
                  <option value="id">National ID</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  {formData.documentFile ? (
                    <div>
                      <p className="text-green-600 font-semibold">{formData.documentFile.name}</p>
                      <p className="text-sm text-gray-500">Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-semibold">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {errors.documentFile && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.documentFile}
                </p>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-semibold mb-2">Document Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Valid government-issued ID</li>
                  <li>Document must be clear and legible</li>
                  <li>Must not be expired</li>
                  <li>Your face must be visible</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Bank Account */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 3: Bank Account Setup</h2>
                <p className="text-gray-600 mb-4">Link your bank account for settlements</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  placeholder="Full name on bank account"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.accountHolderName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.accountHolderName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.accountHolderName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Your bank name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.bankName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.bankName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.bankName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Your bank account number"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.accountNumber ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.accountNumber && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.accountNumber}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-semibold mb-2">Security Notice:</p>
                <p>Your bank account information is encrypted and stored securely. We never share your banking details with third parties.</p>
              </div>
            </div>
          )}

          {/* Step 4: API Keys */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 4: API Configuration</h2>
                <p className="text-gray-600 mb-4">Generate your API credentials</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key Name</label>
                <input
                  type="text"
                  name="apiKeyName"
                  value={formData.apiKeyName}
                  onChange={handleInputChange}
                  placeholder="e.g., Production Key"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.apiKeyName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.apiKeyName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.apiKeyName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Description (Optional)</label>
                <textarea
                  name="apiDescription"
                  value={formData.apiDescription}
                  onChange={handleInputChange}
                  placeholder="What will this key be used for?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-gray-900 mb-2">API Integration Includes:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Payment Processing API</li>
                  <li>Webhook Support</li>
                  <li>Real-time Transaction Updates</li>
                  <li>Comprehensive Documentation</li>
                  <li>24/7 Support</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">You're All Set!</h2>
                <p className="text-gray-600 text-lg">Your account is ready to accept payments</p>
              </div>

              {apiKey && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">Your API Key:</p>
                  <div className="bg-gray-900 text-green-400 font-mono p-4 rounded break-all text-xs">
                    {apiKey}
                  </div>
                  <p className="text-xs text-red-600 mt-3 font-semibold">
                    ⚠️ Keep this key safe. Don't share it publicly.
                  </p>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
                <p className="font-semibold text-gray-900 mb-3">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Read the <span className="font-semibold">API Documentation</span></li>
                  <li>Set up <span className="font-semibold">Webhooks</span> for payment notifications</li>
                  <li>Test with <span className="font-semibold">Sandbox Mode</span></li>
                  <li>Go <span className="font-semibold">Live</span> and start accepting payments</li>
                </ol>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Go to Dashboard
                </button>
                <button className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors">
                  View Documentation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 5 && (
          <div className="flex gap-4">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentStep === STEPS.length - 1 ? "Complete" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
