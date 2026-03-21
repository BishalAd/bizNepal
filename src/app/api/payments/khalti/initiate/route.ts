import { NextResponse } from 'next/server'
import { initKhaltiPayment } from '@/lib/payments/khalti'

export async function POST(request: Request) {
  try {
    const { amount, orderId, customerName, customerPhone, customerEmail, purchaseOrderName } = await request.json()

    // Required by Khalti epayment initiation endpoint
    const secretKey = process.env.KHALTI_SECRET_KEY || '80bd819afc11488c9a629af94a4c6a99' // mock default
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const payload = {
      return_url: `${appUrl}/payment/khalti/success`,
      website_url: appUrl,
      amount: Math.round(amount * 100), // convert NPR to paisa
      purchase_order_id: orderId,
      purchase_order_name: purchaseOrderName || 'BizNepal Purchase',
      customer_info: {
        name: customerName,
        email: customerEmail || 'noemail@biznepal.com',
        phone: customerPhone // Needs to be typical Nepal format if possible 98XXXXXXXX
      }
    }

    const result = await initKhaltiPayment(secretKey, payload)
    
    // Returns pidx, payment_url, etc.
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Khalti Init Error:', error)
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 })
  }
}
