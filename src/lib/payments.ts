/**
 * Payment gateway helpers shared across product, event, and offer purchase flows.
 */

export type PaymentGateway = 'khalti' | 'esewa' | 'fonepay'

/** Returns the first available payment gateway for a business, or null if none configured. */
export function getPaymentGateway(business: {
  khalti_merchant_id?: string | null
  esewa_merchant_id?: string | null
  fonepay_merchant_code?: string | null
}): PaymentGateway | null {
  if (business.khalti_merchant_id) return 'khalti'
  if (business.esewa_merchant_id) return 'esewa'
  if (business.fonepay_merchant_code) return 'fonepay'
  return null
}

/** Returns true if the business has at least one payment gateway configured. */
export function hasOnlinePayment(business: {
  khalti_merchant_id?: string | null
  esewa_merchant_id?: string | null
  fonepay_merchant_code?: string | null
}): boolean {
  return getPaymentGateway(business) !== null
}

/**
 * Builds a wa.me WhatsApp link with a URL-encoded message.
 * Accepts a number in any format (with or without country code, spaces, dashes).
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
