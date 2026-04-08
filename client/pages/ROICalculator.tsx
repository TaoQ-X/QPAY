import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { TrendingUp, BarChart3, DollarSign, AlertCircle } from "lucide-react";

export default function ROICalculator() {
  const [monthlyVolume, setMonthlyVolume] = useState(50000);
  const [averageTransaction, setAverageTransaction] = useState(75);
  const [currentProcessor, setCurrentProcessor] = useState("stripe");
  const [paymentMethods, setPaymentMethods] = useState({
    cards: 80,
    wallets: 10,
    crypto: 5,
    bank: 5,
  });

  // Current processor fees
  const processorFees: Record<string, Record<string, number>> = {
    stripe: {
      base: 2.9,
      fixed: 0.30,
      international: 3.9,
      monthly: 0,
      settlement: 0,
    },
    paypal: {
      base: 3.49,
      fixed: 0.49,
      international: 4.99,
      monthly: 0,
      settlement: 0.25,
    },
    square: {
      base: 2.6,
      fixed: 0.10,
      international: 3.5,
      monthly: 0,
      settlement: 0,
    },
  };

  // QPay fees - always the lowest
  const qpayFees = {
    base: 1.8,
    fixed: 0.15,
    international: 2.5,
    monthly: 0,
    settlement: 0.25,
  };

  // Calculate metrics
  const calculations = useMemo(() => {
    const transactions = monthlyVolume / averageTransaction;
    const currentFeePercent = processorFees[currentProcessor].base;
    const currentFixedFee = processorFees[currentProcessor].fixed;
    const currentMonthlyFee = processorFees[currentProcessor].monthly;
    const currentSettlementFee = processorFees[currentProcessor].settlement * transactions;

    // Current processor costs
    const currentCardFees = (monthlyVolume * (paymentMethods.cards / 100)) * (currentFeePercent / 100);
    const currentCardFixed = transactions * (paymentMethods.cards / 100) * currentFixedFee;
    const currentTotalMonthly = currentCardFees + currentCardFixed + currentMonthlyFee + currentSettlementFee;
    const currentYearly = currentTotalMonthly * 12;

    // QPay costs
    const qpayCardFees = (monthlyVolume * (paymentMethods.cards / 100)) * (qpayFees.base / 100);
    const qpayCardFixed = transactions * (paymentMethods.cards / 100) * qpayFees.fixed;
    const qpayWalletFees = (monthlyVolume * (paymentMethods.wallets / 100)) * 2.5 / 100;
    const qpayWalletFixed = transactions * (paymentMethods.wallets / 100) * 0.15;
    const qpayCryptoFees = 0; // No fees for crypto
    const qpayBankFees = (monthlyVolume * (paymentMethods.bank / 100)) * (1.5 / 100);
    const qpaySettlementFee = qpayFees.settlement * transactions;

    const qpayTotalMonthly = qpayCardFees + qpayCardFixed + qpayWalletFees + qpayWalletFixed + qpayBankFees + qpaySettlementFee;
    const qpayYearly = qpayTotalMonthly * 12;

    const monthlySavings = currentTotalMonthly - qpayTotalMonthly;
    const yearlySavings = currentYearly - qpayYearly;
    const savingsPercentage = ((monthlySavings / currentTotalMonthly) * 100);

    // ROI metrics
    const conversionLift = (monthlyVolume * 0.02) * averageTransaction; // 2% conversion improvement
    const revenueIncrease = conversionLift * 12;

    return {
      transactions,
      currentTotalMonthly,
      currentYearly,
      qpayTotalMonthly,
      qpayYearly,
      monthlySavings: Math.max(0, monthlySavings),
      yearlySavings: Math.max(0, yearlySavings),
      savingsPercentage: Math.max(0, savingsPercentage),
      conversionLift,
      revenueIncrease,
      roi: yearlySavings > 0 ? ((revenueIncrease / qpayYearly) * 100) : 0,
    };
  }, [monthlyVolume, averageTransaction, currentProcessor, paymentMethods]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ROI Calculator</h1>
          <p className="text-lg text-gray-600">
            See how much you can save by switching to QPay
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Numbers</h2>

              {/* Monthly Volume */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Volume
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">$</span>
                  <input
                    type="number"
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="5000"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                  className="w-full mt-2"
                />
              </div>

              {/* Average Transaction */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Transaction
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">$</span>
                  <input
                    type="number"
                    value={averageTransaction}
                    onChange={(e) => setAverageTransaction(Number(e.target.value))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={averageTransaction}
                  onChange={(e) => setAverageTransaction(Number(e.target.value))}
                  className="w-full mt-2"
                />
              </div>

              {/* Current Processor */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Processor
                </label>
                <select
                  value={currentProcessor}
                  onChange={(e) => setCurrentProcessor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="stripe">Stripe (2.9% + $0.30)</option>
                  <option value="paypal">PayPal (3.49% + $0.49)</option>
                  <option value="square">Square (2.6% + $0.10)</option>
                </select>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Methods Mix
                </label>
                <div className="space-y-3">
                  {Object.entries(paymentMethods).map(([method, percentage]) => (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 capitalize">{method}</span>
                        <span className="font-medium text-gray-900">{percentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) =>
                          setPaymentMethods({
                            ...paymentMethods,
                            [method]: Number(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-600">
                <p>
                  <strong>Note:</strong> Total should equal 100% for accurate results
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Savings */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Monthly Savings</p>
                  <p className="text-4xl font-bold text-green-600 mb-1">
                    ${calculations.monthlySavings.toFixed(0)}
                  </p>
                  <p className="text-sm text-green-700">
                    {calculations.savingsPercentage.toFixed(1)}% reduction in fees
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Yearly Savings</p>
                  <p className="text-4xl font-bold text-green-600 mb-1">
                    ${calculations.yearlySavings.toFixed(0)}
                  </p>
                  <p className="text-sm text-green-700">
                    That's {(calculations.yearlySavings / 12).toFixed(0)} per month
                  </p>
                </div>
              </div>
            </div>

            {/* Cost Comparison */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Fee Comparison</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900">Current Processor</span>
                    <span className="font-bold text-gray-900">
                      ${calculations.currentTotalMonthly.toFixed(0)}/month
                    </span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-3">
                    <div className="bg-red-600 h-3 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900">QPay</span>
                    <span className="font-bold text-gray-900">
                      ${calculations.qpayTotalMonthly.toFixed(0)}/month
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{
                        width: `${(calculations.qpayTotalMonthly / calculations.currentTotalMonthly) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Yearly Fee Comparison:</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Current Processor</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${calculations.currentYearly.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">QPay</p>
                      <p className="text-xl font-bold text-green-600">
                        ${calculations.qpayYearly.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Benefits */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Additional QPay Benefits</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Conversion Rate Improvement</p>
                    <p className="text-sm text-gray-600">
                      +2% average with express checkout: <strong>${calculations.conversionLift.toFixed(0)}/month</strong>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Increased Revenue (Annually)</p>
                    <p className="text-sm text-gray-600">
                      From reduced cart abandonment: <strong>${calculations.revenueIncrease.toFixed(0)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Advanced Analytics</p>
                    <p className="text-sm text-gray-600">
                      Real-time fraud detection and merchant insights included
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ROI Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Total ROI</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Fee Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${calculations.yearlySavings.toFixed(0)}
                  </p>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Revenue Growth</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${calculations.revenueIncrease.toFixed(0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Impact</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(calculations.yearlySavings + calculations.revenueIncrease).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Ready to Start Saving?</h3>
              <p className="text-gray-600 mb-6">
                See these savings in action. Try QPay free for 14 days - no credit card required.
              </p>
              <a
                href="/register/sme"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Calculator FAQ</h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">How accurate is this calculator?</h3>
              <p className="text-gray-700">
                Very accurate! We use real fee structures from major processors. Actual savings may vary based on your specific transaction patterns and volume discounts.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Are there any hidden fees?</h3>
              <p className="text-gray-700">
                No. QPay pricing is transparent. What you see in the calculator is what you pay. We don't have hidden fees, setup costs, or long-term contracts.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">What if I have a high-volume?</h3>
              <p className="text-gray-700">
                Our Enterprise plan offers custom pricing for merchants with monthly volumes over $100K. Contact our sales team for a personalized quote.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Can I see the breakdown by payment method?</h3>
              <p className="text-gray-700">
                The calculator shows aggregate fees. For detailed breakdown by payment method, please schedule a demo with our team.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
