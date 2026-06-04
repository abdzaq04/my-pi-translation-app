// Pi Network Payment Integration Service
// Handles Pi payment processing for premium subscriptions

export interface PiPaymentConfig {
  apiKey: string
  productName: string
  productDescription: string
  callbacks: {
    onReadyForServerCompletion: (paymentId: string, txid: string) => Promise<void>
    onCancel: (paymentId: string) => void
    onError: (error: Error, payment: any) => void
  }
}

export interface PiPaymentRequest {
  amount: number
  memo: string
  metadata: {
    userId: string
    subscriptionTier: 'premium'
    billingCycle: 'monthly' | 'yearly'
  }
}

export interface PiPaymentResponse {
  transactionId: string
  status: 'success' | 'pending' | 'failed'
  amount: number
  timestamp: Date
  userId: string
}

let piInstance: any = null

// Initialize Pi SDK
export async function initializePiPayment(config: Omit<PiPaymentConfig, 'callbacks'>) {
  try {
    // Pi SDK initialization (in production)
    if (typeof window !== 'undefined' && (window as any).Pi) {
      const Pi = (window as any).Pi
      await Pi.init({ version: '2.0', challenge: config.apiKey })
      return true
    }
    console.log('[Polytalk] Pi SDK not available - using mock mode')
    return false
  } catch (error) {
    console.error('[Polytalk] Pi initialization error:', error)
    return false
  }
}

// Process Pi payment for premium upgrade
export async function processPiPayment(
  userId: string,
  amount: number = 9.99,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<PiPaymentResponse> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Payment processing requires browser environment')
    }

    const Pi = (window as any).Pi
    
    if (!Pi) {
      // Mock mode for development/testing
      console.log('[Polytalk] Using mock Pi payment mode')
      return mockPiPayment(userId, amount)
    }

    const paymentData = {
      amount,
      memo: `Polytalk Premium Subscription - ${billingCycle} billing`,
      metadata: {
        userId,
        subscriptionTier: 'premium',
        billingCycle,
      },
    }

    // Create payment with Pi SDK
    const payment = await Pi.createPayment(paymentData, {
      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        await completePayment(userId, paymentId, txid)
      },
      onCancel: (paymentId: string) => {
        console.log(`[Polytalk] Payment cancelled: ${paymentId}`)
      },
      onError: (error: Error) => {
        console.error(`[Polytalk] Payment error:`, error)
      },
    })

    return {
      transactionId: payment.identifier,
      status: 'pending',
      amount,
      timestamp: new Date(),
      userId,
    }
  } catch (error) {
    console.error('[Polytalk] Payment processing error:', error)
    throw error
  }
}

// Complete payment on server
async function completePayment(userId: string, paymentId: string, txid: string): Promise<void> {
  try {
    const response = await fetch('/api/payments/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        paymentId,
        txid,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error('Payment completion failed')
    }

    console.log('[Polytalk] Payment completed successfully')
  } catch (error) {
    console.error('[Polytalk] Error completing payment:', error)
    throw error
  }
}

// Mock payment for development
function mockPiPayment(userId: string, amount: number): PiPaymentResponse {
  const mockTransactionId = `mock_pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  return {
    transactionId: mockTransactionId,
    status: 'success',
    amount,
    timestamp: new Date(),
    userId,
  }
}

// Verify payment on backend
export async function verifyPiPayment(transactionId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.verified === true
  } catch (error) {
    console.error('[Polytalk] Payment verification error:', error)
    return false
  }
}

// Get payment history for user
export async function getPaymentHistory(userId: string): Promise<PiPaymentResponse[]> {
  try {
    const response = await fetch(`/api/payments/history?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch payment history')
    }
    return await response.json()
  } catch (error) {
    console.error('[Polytalk] Error fetching payment history:', error)
    return []
  }
}

// Request refund for payment
export async function requestRefund(transactionId: string, reason: string): Promise<boolean> {
  try {
    const response = await fetch('/api/payments/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, reason }),
    })

    if (!response.ok) {
      throw new Error('Refund request failed')
    }

    return true
  } catch (error) {
    console.error('[Polytalk] Refund request error:', error)
    return false
  }
}

export const PI_CONFIG = {
  PREMIUM_PRICE_MONTHLY: 9.99,
  PREMIUM_PRICE_YEARLY: 99.99,
  SANDBOX_URL: 'https://sandbox.pi.network',
  PRODUCTION_URL: 'https://api.pi.network',
  DEVELOPER_KEY: process.env.NEXT_PUBLIC_PI_DEVELOPER_KEY || 'dev_key',
  API_KEY: process.env.PI_API_KEY || '',
}
