export const KHALTI_INIT_URL = 'https://a.khalti.com/api/v2/epayment/initiate/'
export const KHALTI_LOOKUP_URL = 'https://a.khalti.com/api/v2/epayment/lookup/'

interface KhaltiInitPayload {
  return_url: string
  website_url: string
  amount: number // in paisa
  purchase_order_id: string
  purchase_order_name: string
  customer_info: {
    name: string
    email: string
    phone: string
  }
}

export async function initKhaltiPayment(secretKey: string, payload: KhaltiInitPayload) {
  const response = await fetch(KHALTI_INIT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Khalti Init failed')
  return data // Returns { pidx, payment_url, expires_at, expires_in }
}

export async function verifyKhaltiPayment(secretKey: string, pidx: string) {
  const response = await fetch(KHALTI_LOOKUP_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ pidx })
  })
  
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Khalti Verify failed')
  return data // Returns { status: 'Completed' | 'Pending' | 'Expired', transaction_id, raw_amount... }
}
