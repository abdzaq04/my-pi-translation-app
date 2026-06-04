"use client"

import { AlertCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getRemainingTranslations } from "@/lib/services/subscription"

interface UsageLimitBannerProps {
  onUpgradeClick: () => void
  isFreeTier: boolean
}

export function UsageLimitBanner({ onUpgradeClick, isFreeTier }: UsageLimitBannerProps) {
  const remaining = getRemainingTranslations()

  if (!isFreeTier || remaining === Infinity) {
    return null
  }

  const isLowOnQuota = remaining <= 3
  const isOutOfQuota = remaining === 0

  if (isOutOfQuota) {
    return (
      <Card className="mx-2 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-600 text-sm mb-1">Daily Limit Reached</h3>
            <p className="text-xs text-red-500/80 mb-3">
              You&apos;ve used all 10 free translations for today. Upgrade to Premium for unlimited access.
            </p>
            <Button
              onClick={onUpgradeClick}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg"
            >
              <Zap className="w-3 h-3 mr-1" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`mx-2 mb-4 p-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 ${
      isLowOnQuota
        ? 'bg-yellow-500/10 border border-yellow-500/30'
        : 'bg-blue-500/10 border border-blue-500/30'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium ${isLowOnQuota ? 'text-yellow-600' : 'text-blue-600'}`}>
            {remaining} {remaining === 1 ? 'translation' : 'translations'} left today
          </p>
          <p className={`text-xs mt-0.5 ${isLowOnQuota ? 'text-yellow-500/80' : 'text-blue-500/80'}`}>
            {isLowOnQuota ? 'Running low on daily quota' : 'Free tier includes 10 translations per day'}
          </p>
        </div>
        <Button
          onClick={onUpgradeClick}
          variant="outline"
          size="sm"
          className="text-xs rounded-lg ml-2 flex-shrink-0"
        >
          Upgrade
        </Button>
      </div>
    </Card>
  )
}
