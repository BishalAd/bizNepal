import { useMemo } from 'react'

export type PlanType = 'free' | 'basic' | 'pro'

interface UsageLimits {
  products: number
  offers: number
  jobs: number
  events: number
}

const PLAN_LIMITS: Record<PlanType, UsageLimits> = {
  free:  { products: 5, offers: 1, jobs: 1, events: 0 },
  basic: { products: 50, offers: 5, jobs: 3, events: 3 },
  pro:   { products: 999999, offers: 999999, jobs: 999999, events: 999999 } // Infinity
}

export function useFeatureAccess(currentPlan: PlanType = 'free') {
  const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free

  const canAddProduct = (currentCount: number) => currentCount < limits.products
  const canAddOffer = (currentCount: number) => currentCount < limits.offers
  const canAddJob = (currentCount: number) => currentCount < limits.jobs
  const canAddEvent = (currentCount: number) => currentCount < limits.events

  return {
    isPro: currentPlan === 'pro',
    planLimits: limits,
    canAddProduct,
    canAddOffer,
    canAddJob,
    canAddEvent
  }
}
