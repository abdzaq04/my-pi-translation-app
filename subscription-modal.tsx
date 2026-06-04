"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X, Lock, Zap } from "lucide-react"
import { SUBSCRIPTION_PLANS, upgradeToPremium } from "@/lib/services/subscription"
import { processPiPayment as piPayment } from "@/lib/services/pi-payment"

interface SubscriptionModalProps {
  onClose: () => void
  onUpgradeSuccess: (transactionId: string) => void
  isOpen: boolean
}

export function SubscriptionModal({ onClose, onUpgradeSuccess, isOpen }: SubscriptionModalProps) {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const freePlan = SUBSCRIPTION_PLANS.free
  const premiumPlan = SUBSCRIPTION_PLANS.premium
  const premiumPrice = selectedBilling === 'monthly' ? '9.99' : '99.99'
  const savings = selectedBilling === 'yearly' ? 'Save 17%' : ''

  const handleUpgrade = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Process Pi payment
      const paymentResponse = await piPayment('user_premium_upgrade', parseFloat(premiumPrice), selectedBilling)
      
      if (paymentResponse.status === 'success') {
        // Upgrade subscription
        const updated = upgradeToPremium(paymentResponse.transactionId)
        onUpgradeSuccess(paymentResponse.transactionId)
        
        // Close modal after success
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError('Payment processing failed. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during payment')
      console.error('[Polytalk] Upgrade error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border bg-card rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Choose Your Plan
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Unlock unlimited translations and premium features with Polytalk Premium
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Billing Cycle:</span>
            <div className="flex gap-2 bg-secondary/30 p-1 rounded-lg">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedBilling === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                  selectedBilling === 'yearly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                {selectedBilling === 'yearly' && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {savings}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="px-6 py-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="relative">
              <Card className="p-6 border-border bg-card/50 h-full flex flex-col hover:bg-card/70 transition-colors">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{freePlan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Perfect for trying it out</p>
                </div>

                <div className="mb-6">
                  <div className="text-3xl font-bold">Free</div>
                  <p className="text-sm text-muted-foreground mt-1">Forever</p>
                </div>

                <div className="space-y-3 flex-1">
                  {freePlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button disabled variant="outline" className="w-full rounded-lg mt-6 cursor-default">
                  Current Plan
                </Button>
              </Card>
            </div>

            {/* Premium Plan */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                RECOMMENDED
              </div>
              <Card className="p-6 border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 h-full flex flex-col hover:border-primary hover:shadow-lg transition-all ring-2 ring-primary/20">
                <div className="mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {premiumPlan.name}
                    <Lock className="w-4 h-4 text-primary" />
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">All-access translation power</p>
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-bold text-primary">
                    {premiumPrice}
                    <span className="text-lg text-muted-foreground font-normal">
                      {selectedBilling === 'monthly' ? '/mo' : '/year'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Paid with Pi</p>
                </div>

                <div className="space-y-3 flex-1">
                  {premiumPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="w-full rounded-lg mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all"
                >
                  {isProcessing ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade with Pi
                    </>
                  )}
                </Button>
              </Card>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-6">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <X className="w-4 h-4" />
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-secondary/30 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Secure payment powered by Pi Network. Cancel anytime from your account settings.
          </p>
        </div>
      </Card>
    </div>
  )
}
