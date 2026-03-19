import { useState } from "react";
import Header from "@/components/Header";
import {
  CheckCircle,
  FileText,
  CreditCard,
  Lock,
  ArrowRight,
  Upload,
  AlertCircle,
} from "lucide-react";

type OnboardingStep = "welcome" | "kyc" | "bank" | "api" | "complete";

interface OnboardingState {
  step: OnboardingStep;
  kycDocument: File | null;
  bankAccount: { name: string; number: string };
  apiKey: string;
}

export default function OnboardingWizard() {
  const [state, setState] = useState<OnboardingState>({
    step: "welcome",
    kycDocument: null,
    bankAccount: { name: "", number: "" },
    apiKey: "",
  });

  const [progress, setProgress] = useState(0);

  const steps: { id: OnboardingStep; title: string; percentage: number }[] = [
    { id: "welcome", title: "Welcome", percentage: 0 },
    { id: "kyc", title: "KYC Verification", percentage: 25 },
    { id: "bank", title: "Bank Account", percentage: 50 },
    { id: "api", title: "API Setup", percentage: 75 },
    { id: "complete", title: "Complete", percentage: 100 },
  ];

  const currentStepData = steps.find((s) => s.id === state.step);

  const handleNext = (step: OnboardingStep) => {
    setState({ ...state, step });
    const newStep = steps.find((s) => s.id === step);
    setProgress(newStep?.percentage || 0);
  };

  const handleDocumentUpload = (file: File) => {
    setState({ ...state, kycDocument: file });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to QPay</h1>
              <span className="text-lg font-semibold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex gap-2 mb-12 overflow-x-auto pb-2">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => handleNext(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  state.step === step.id
                    ? "bg-blue-600 text-white"
                    : progress >= step.percentage
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {progress > step.percentage && <CheckCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">{step.title}</span>
              </button>
            ))}
          </div>

          {/* Welcome Step */}
          {state.step === "welcome" && (
            <div className="bg-white rounded-lg shadow-lg p-8 animate-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Let's Get You Started
              </h2>
              <p className="text-gray-600 mb-6">
                We'll guide you through the setup process in just a few minutes.
              </p>

              <div className="space-y-4 mb-8">
                {["KYC Verification", "Bank Account Setup", "API Configuration"].map(
                  (item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  )
                )}
              </div>

              <button
                onClick={() => handleNext("kyc")}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                Let's Start <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* KYC Step */}
          {state.step === "kyc" && (
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6 animate-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  KYC Verification
                </h2>
                <p className="text-gray-600">
                  Upload your government-issued ID to verify your identity
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-2">
                  Drag and drop your document
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Accepted formats: PDF, JPG, PNG (Max 10MB)
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    onChange={(e) => e.target.files && handleDocumentUpload(e.target.files[0])}
                    className="hidden"
                    accept=".pdf,.jpg,.png"
                  />
                  <span className="px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                    Choose File
                  </span>
                </label>
              </div>

              {state.kycDocument && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">{state.kycDocument.name}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleNext("welcome")}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNext("bank")}
                  disabled={!state.kycDocument}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Bank Step */}
          {state.step === "bank" && (
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6 animate-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Bank Account
                </h2>
                <p className="text-gray-600">
                  Link your bank account for settlements
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={state.bankAccount.name}
                    onChange={(e) =>
                      setState({
                        ...state,
                        bankAccount: { ...state.bankAccount, name: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={state.bankAccount.number}
                    onChange={(e) =>
                      setState({
                        ...state,
                        bankAccount: { ...state.bankAccount, number: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Your bank information is encrypted and secured
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleNext("kyc")}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => handleNext("api")}
                  disabled={!state.bankAccount.name || !state.bankAccount.number}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* API Step */}
          {state.step === "api" && (
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6 animate-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-blue-600" />
                  API Configuration
                </h2>
                <p className="text-gray-600">
                  Generate your first API key
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key Name
                </label>
                <input
                  type="text"
                  value={state.apiKey}
                  onChange={(e) => setState({ ...state, apiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Production API Key"
                />
              </div>

              <button
                onClick={() => handleNext("complete")}
                disabled={!state.apiKey}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Complete Setup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Complete Step */}
          {state.step === "complete" && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6 animate-in">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                You're All Set!
              </h2>
              <p className="text-gray-600">
                Your QPay account is ready to use. Start accepting payments today!
              </p>

              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
