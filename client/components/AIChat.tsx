import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X, Loader, ThumbsUp, ThumbsDown } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai" | "suggestion";
  content: string;
  timestamp: Date;
  rating?: "helpful" | "unhelpful";
  suggestions?: string[];
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hi there! 👋 I'm QPay's AI Support Assistant. I can help you with integration questions, troubleshooting, billing inquiries, and more. What can I help you with?",
      timestamp: new Date(),
      suggestions: [
        "How do I integrate QPay?",
        "Webhook setup help",
        "Settlement timeline",
        "API documentation",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate AI response based on query
    const aiResponse = generateAIResponse(text);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "ai",
      content: aiResponse.content,
      timestamp: new Date(),
      suggestions: aiResponse.suggestions,
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const generateAIResponse = (
    query: string
  ): { content: string; suggestions: string[] } => {
    const lowerQuery = query.toLowerCase();

    // Integration help
    if (
      lowerQuery.includes("integrat") ||
      lowerQuery.includes("setup") ||
      lowerQuery.includes("implement")
    ) {
      return {
        content: `Great question! To integrate QPay, follow these steps:

1. **Get API Keys**: Generate them from your dashboard
2. **Choose Integration Method**:
   - REST API for custom solutions
   - Pre-built plugins (WooCommerce, Shopify)
   - Payment form for quick setup
   - Mobile SDK for apps
3. **Set Up Webhooks**: Receive real-time transaction updates
4. **Test in Sandbox**: Use test API keys first
5. **Go Live**: Switch to production keys

For detailed docs: https://docs.qpay.io/integration`,
        suggestions: [
          "Show me REST API example",
          "WooCommerce plugin setup",
          "Webhook configuration",
          "Testing in sandbox",
        ],
      };
    }

    // Webhook help
    if (lowerQuery.includes("webhook")) {
      return {
        content: `Webhooks are great for real-time updates! Here's what you need to know:

**Supported Events**:
- payment.confirmed ✓
- payment.failed ✓
- refund.processed ✓
- settlement.completed ✓
- dispute.opened ✓

**Setup Steps**:
1. Go to Dashboard > Webhooks
2. Add your endpoint URL
3. Subscribe to events
4. Verify HMAC signatures

**Best Practices**:
- Implement retry logic (we retry 5 times)
- Return HTTP 200 within 30 seconds
- Verify signatures for security
- Log all webhook events`,
        suggestions: [
          "HMAC signature verification",
          "Webhook retry policy",
          "All available events",
          "Testing webhooks locally",
        ],
      };
    }

    // Settlement questions
    if (lowerQuery.includes("settlement") || lowerQuery.includes("payout")) {
      return {
        content: `Settlement information:

**Standard Settlement** (1-2 business days):
- Funds settle to your bank account
- Daily batching at 5 PM EST
- $0.25 settlement fee

**Express Settlement** (< 4 hours):
- Available for high-volume merchants
- 0.5% settlement fee
- Request via API or dashboard

**Requirements**:
- ✓ Completed KYC verification
- ✓ Active bank account link
- ✓ Positive account balance

**Timing**:
- Crypto: 30 minutes (blockchain dependent)
- Cards: 1-2 business days
- Wallets: 1 business day`,
        suggestions: [
          "Express settlement costs",
          "Settlement failures troubleshooting",
          "Bank link verification",
          "Cryptocurrency settlement",
        ],
      };
    }

    // Security & compliance
    if (
      lowerQuery.includes("security") ||
      lowerQuery.includes("pci") ||
      lowerQuery.includes("compliance") ||
      lowerQuery.includes("fraud")
    ) {
      return {
        content: `QPay takes security seriously! Here's our compliance:

**Certifications**:
- ✓ PCI-DSS Level 1 (highest standard)
- ✓ SOC 2 Type II audited
- ✓ ISO 27001 certified
- ✓ GDPR compliant

**Security Features**:
- AES-256-GCM encryption
- TLS 1.2+ only
- 2FA for accounts
- AI fraud detection
- Real-time monitoring

**Your Responsibilities**:
- Use HTTPS only
- Never log card numbers
- Implement CSP headers
- Regular security audits

Learn more: https://qpay.io/security`,
        suggestions: [
          "Fraud detection details",
          "PCI-DSS requirements for merchants",
          "Security best practices",
          "Incident reporting",
        ],
      };
    }

    // Billing & pricing
    if (
      lowerQuery.includes("price") ||
      lowerQuery.includes("cost") ||
      lowerQuery.includes("bill") ||
      lowerQuery.includes("fee")
    ) {
      return {
        content: `Here's our transparent pricing:

**Transaction Fees**:
- Cards: 2.9% + $0.30
- Bank transfers: 1.5%
- Cryptocurrency: 0% (network fees apply)
- Wallets (Apple Pay, Google Pay): 2.5%

**Monthly Plans**:
- **Free**: $0 (up to 10 transactions)
- **Starter**: $29 (up to $10K/month)
- **Pro**: $99 (up to $100K/month)
- **Enterprise**: Custom pricing

**Additional Fees**:
- Settlement: $0.25 standard / 0.5% express
- API rate limits: Included up to 10K/month
- Webhook retries: Free (5 automatic retries)

See detailed breakdown: https://qpay.io/pricing`,
        suggestions: [
          "Compare pricing plans",
          "Enterprise custom pricing",
          "International transaction fees",
          "Refund fee structure",
        ],
      };
    }

    // Default response
    return {
      content: `I'm here to help! I can assist with:
• API integration and setup
• Webhooks and event handling
• Settlement and payouts
• Security and compliance
• Pricing and billing
• Troubleshooting issues

Feel free to ask me anything, or browse our full documentation at docs.qpay.io`,
      suggestions: [
        "Show me integration guide",
        "Explain webhook setup",
        "Settlement timeline",
        "Connect to live agent",
      ],
    };
  };

  const handleRating = (messageId: string, rating: "helpful" | "unhelpful") => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, rating } : msg
      )
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
        title="Chat with AI Support"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">QPay Support</h3>
          <p className="text-xs text-blue-100">AI-powered assistant</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-blue-800 p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id}>
            {message.type === "user" ? (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg p-3 max-w-xs">
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-3 mb-2">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  {/* Rating */}
                  {!message.rating && (
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => handleRating(message.id, "helpful")}
                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-green-600"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRating(message.id, "unhelpful")}
                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-600"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="space-y-2">
                      {message.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestedQuestion(suggestion)}
                          className="block w-full text-left text-xs bg-white border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Loader className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-600">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask me anything..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: You can ask about integration, webhooks, settlement, security, pricing, and more!
        </p>
      </div>
    </div>
  );
}
