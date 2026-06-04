// Subscription tier definitions
export type SubscriptionTier = 'free' | 'premium'

export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  price: number
  currency: string
  features: string[]
  dailyLimit?: number
  offlineSupport: boolean
  voiceQuality: 'standard' | 'premium'
  processingSpeed: 'standard' | 'fast'
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'PI',
    features: [
      'Basic translations',
      '10 translations/day',
      'Standard voice quality',
      'Standard processing speed',
      'Web-only access',
    ],
    dailyLimit: 10,
    offlineSupport: false,
    voiceQuality: 'standard',
    processingSpeed: 'standard',
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    price: 9.99,
    currency: 'PI',
    features: [
      'Unlimited translations',
      'Download offline language packs',
      'Premium voice output',
      'Faster processing',
      'Priority support',
      'API access (future)',
    ],
    offlineSupport: true,
    voiceQuality: 'premium',
    processingSpeed: 'fast',
  },
}

export interface UserSubscription {
  userId: string
  tier: SubscriptionTier
  startDate: Date
  renewalDate: Date
  isActive: boolean
  piTransactionId?: string
  cancellationDate?: Date
}

export interface UsageStats {
  userId: string
  date: string
  translationsCount: number
  offlinePacks: number
  lastReset: Date
}

// Local storage keys
const SUBSCRIPTION_KEY = 'polytalk_subscription'
const USAGE_STATS_KEY = 'polytalk_usage_stats'
const USER_ID_KEY = 'polytalk_user_id'

// Initialize or get user ID
export function getUserId(): string {
  let userId = localStorage?.getItem(USER_ID_KEY)
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage?.setItem(USER_ID_KEY, userId)
  }
  return userId
}

// Get current subscription
export function getSubscription(): UserSubscription {
  const stored = localStorage?.getItem(SUBSCRIPTION_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  
  return {
    userId: getUserId(),
    tier: 'free',
    startDate: new Date(),
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  }
}

// Save subscription
export function saveSubscription(subscription: UserSubscription): void {
  localStorage?.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription))
}

// Get today's usage stats
export function getTodayUsage(): UsageStats {
  const today = new Date().toISOString().split('T')[0]
  const stored = localStorage?.getItem(USAGE_STATS_KEY)
  
  if (stored) {
    const stats = JSON.parse(stored) as UsageStats
    if (stats.date === today) {
      return stats
    }
  }
  
  return {
    userId: getUserId(),
    date: today,
    translationsCount: 0,
    offlinePacks: 0,
    lastReset: new Date(),
  }
}

// Save usage stats
export function saveUsageStats(stats: UsageStats): void {
  localStorage?.setItem(USAGE_STATS_KEY, JSON.stringify(stats))
}

// Increment translation count
export function incrementTranslationCount(): UsageStats {
  const stats = getTodayUsage()
  stats.translationsCount += 1
  saveUsageStats(stats)
  return stats
}

// Check if user can translate
export function canTranslate(): boolean {
  const subscription = getSubscription()
  if (subscription.tier === 'premium') {
    return true
  }
  
  const usage = getTodayUsage()
  const plan = SUBSCRIPTION_PLANS.free
  return usage.translationsCount < (plan.dailyLimit || 10)
}

// Get remaining translations for free tier
export function getRemainingTranslations(): number {
  const subscription = getSubscription()
  if (subscription.tier === 'premium') {
    return Infinity
  }
  
  const usage = getTodayUsage()
  const plan = SUBSCRIPTION_PLANS.free
  const limit = plan.dailyLimit || 10
  return Math.max(0, limit - usage.translationsCount)
}

// Upgrade to premium
export function upgradeToPremium(transactionId: string): UserSubscription {
  const subscription = getSubscription()
  const upgraded: UserSubscription = {
    ...subscription,
    tier: 'premium',
    startDate: new Date(),
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    piTransactionId: transactionId,
  }
  saveSubscription(upgraded)
  return upgraded
}

// Cancel subscription
export function cancelSubscription(): UserSubscription {
  const subscription = getSubscription()
  const cancelled: UserSubscription = {
    ...subscription,
    tier: 'free',
    isActive: false,
    cancellationDate: new Date(),
  }
  saveSubscription(cancelled)
  return cancelled
}

export function getPlanFeatures(tier: SubscriptionTier): string[] {
  return SUBSCRIPTION_PLANS[tier].features
}
