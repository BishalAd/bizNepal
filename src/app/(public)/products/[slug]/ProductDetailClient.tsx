'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProductGrid from '@/components/products/ProductGrid'
import { Heart, Star, Store, MapPin, Phone, MessageCircle, Minus, Plus, ShieldCheck, Check, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { hasOnlinePayment, buildWhatsAppUrl } from '@/lib/payments'

const SimpleMap = dynamic(() => import('@/components/ui/SimpleMap'), { 
  ssr: false, 
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" /> 
})

interface Business {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  address?: string | null
  city?: string | null
  phone?: string | null
  whatsapp?: string | null
  is_verified?: boolean
  latitude?: number | null
  longitude?: number | null
  khalti_merchant_id?: string | null
  esewa_merchant_id?: string | null
  fonepay_merchant_code?: string | null
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discount_price?: number | null
  description?: string | null
  image_keys?: string[] | null
  stock_quantity: number
  low_stock_threshold?: number | null
  business_id: string
  business: Business
  [key: string]: any
}

export default function ProductDetailClient({ product, reviews, relatedProducts }: {
  product: Product
  reviews: any[]
  relatedProducts: any[]
}) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const placeholder = 'https://placehold.co/600x400?text=BizNepal'
  const [activeImage, setActiveImage] = useState((product.image_keys && product.image_keys[0]) || placeholder)
  const [quantity, setQuantity] = useState(1)
  const [isFavourited, setIsFavourited] = useState(false)
  const [isFavLoading, setIsFavLoading] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [showGrabModal, setShowGrabModal] = useState(false)
  const [bookingState, setBookingState] = useState<'form' | 'loading' | 'success'>('form')
  const [ticketCode, setTicketCode] = useState('')
  const [formData, setFormData] = useState({ name: user?.user_metadata?.full_name || '', phone: '' })

  const router = useRouter()

  const business = product.business
  const onlinePayment = hasOnlinePayment(business)

  // Check if already favourited on mount
  useEffect(() => {
    if (!user) return
    supabase
      .from('favourites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }: { data: any }) => { if (data) setIsFavourited(true) })
  }, [user, product.id])

  const discountPercent = product.discount_price && product.discount_price < product.price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : null

  const effectivePrice = product.discount_price ?? product.price

  /** Toggle favourite in the favourites table */
  const handleToggleFavourite = async () => {
    if (!user) {
      toast.error('Please sign in to save favourites')
      return
    }
    setIsFavLoading(true)
    try {
      if (isFavourited) {
        await supabase.from('favourites').delete()
          .eq('user_id', user.id).eq('product_id', product.id)
        setIsFavourited(false)
        toast.success('Removed from favourites')
      } else {
        await supabase.from('favourites').insert({ user_id: user.id, product_id: product.id })
        setIsFavourited(true)
        toast.success('Saved to favourites ❤️')
      }
    } catch {
      toast.error('Could not update favourites')
    } finally {
      setIsFavLoading(false)
    }
  }

  const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase()

  /** WhatsApp purchase — Case A (no merchant): Record natively & decrement */
  const handleWhatsAppBuy = async () => {
    if (!business.whatsapp) return
    setIsProcessing(true)
    const tid = toast.loading('Initiating purchase...')
    try {
      const code = generateCode()
      const orderPayload = {
        business_id: product.business_id,
        customer_id: user?.id || null,
        customer_name: user?.user_metadata?.full_name || 'Customer',
        customer_phone: '',
        items: [{ product_id: product.id, title: product.name, price: effectivePrice, quantity }],
        subtotal: effectivePrice * quantity,
        total: effectivePrice * quantity,
        payment_method: 'whatsapp',
        payment_status: 'pending',
        notes: `WHATSAPP INQUIRY / CODE: ${code}`,
        order_status: 'pending',
      }
      const { error } = await supabase.from('orders').insert(orderPayload)
      if (error) throw error
      await supabase.rpc('decrement_product_stock', { row_id: product.id, qty: quantity })

      toast.success('Generated code!', { id: tid })
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://biz-nepal.vercel.app'
      const msg = `Hi, I'm interested in buying:\n*${product.name}* — NPR ${effectivePrice.toLocaleString()}\nQty: ${quantity}\nMy Purchase Code: *${code}*\nLink: ${appUrl}/products/${product.slug}`
      window.open(buildWhatsAppUrl(business.whatsapp, msg), '_blank')
      setQuantity(1)
      router.refresh()
    } catch (err: any) {
      toast.error('Failed to initiate purchase via WhatsApp', { id: tid })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGrabSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingState('loading')
    try {
      const code = generateCode()
      setTicketCode(code)
      
      const orderPayload = {
        business_id: product.business_id,
        customer_id: user?.id || null,
        customer_name: formData.name,
        customer_phone: formData.phone,
        items: [{ product_id: product.id, title: product.name, price: effectivePrice, quantity }],
        subtotal: effectivePrice * quantity,
        total: effectivePrice * quantity,
        payment_method: 'store_pickup',
        payment_status: 'pending',
        notes: `STORE PICKUP / ORDER CODE: ${code}`,
        order_status: 'pending',
      }
      
      const { error } = await supabase.from('orders').insert(orderPayload)
      if (error) throw error
      await supabase.rpc('decrement_product_stock', { row_id: product.id, qty: quantity })
      
      setBookingState('success')
      router.refresh()
    } catch (err: any) {
      toast.error('Failed to reserve product')
      setBookingState('form')
    }
  }

  /** Online checkout — Case B (has merchant) */
  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please sign in to purchase')
      return
    }
    setIsBuying(true)
    const params = new URLSearchParams({
      productId: product.id,
      quantity: quantity.toString(),
    })
    window.location.href = `/checkout?${params.toString()}`
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  const PurchaseButton = ({ mobile = false }: { mobile?: boolean }) => {
    const base = `flex items-center justify-center gap-2 font-bold transition shadow-sm ${mobile ? 'flex-1 py-3.5 rounded-xl' : 'h-14 rounded-xl w-full'}`

    if (product.stock_quantity <= 0) {
      return (
        <div className={`${base} bg-gray-200 text-gray-500 cursor-not-allowed`}>
          Out of Stock
        </div>
      )
    }

    if (onlinePayment) {
      return (
        <button
          onClick={handleBuyNow}
          disabled={isBuying}
          className={`${base} bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 disabled:opacity-60`}
        >
          {isBuying ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
          Buy Now
        </button>
      )
    }

    if (business.whatsapp) {
      return (
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleWhatsAppBuy}
            disabled={isProcessing}
            className={`${base} bg-[#25D366] hover:bg-[#1ebe5a] disabled:opacity-50 text-white shadow-[#25D366]/20`}
          >
            <MessageCircle className="w-5 h-5" /> Buy via WhatsApp
          </button>
          <button
            onClick={() => setShowGrabModal(true)}
            className={`${base} bg-red-600 hover:bg-red-700 text-white shadow-red-600/20`}
          >
            Reserve & Pay at Store
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={() => setShowGrabModal(true)}
          className={`${base} bg-red-600 hover:bg-red-700 text-white shadow-red-600/20`}
        >
          Reserve & Pay at Store
        </button>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            
            {/* IMAGE GALLERY */}
            <div className="p-4 lg:p-8">
              <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4">
                <Image src={activeImage} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                {discountPercent && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg z-10">
                    {discountPercent}% OFF
                  </div>
                )}
              </div>
              {(product.image_keys?.length ?? 0) > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                  {product.image_keys!.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Image src={img} alt={`${product.name} ${idx}`} fill sizes="96px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PRODUCT DETAILS */}
            <div className="p-4 lg:p-8 lg:border-l border-gray-100 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">{product.name}</h1>
                
                <div className="flex items-center gap-4 mb-6">
                  <Link href={`/businesses/${business.slug}`} className="flex items-center text-sm font-medium text-red-600 hover:text-red-700">
                    <Store className="w-4 h-4 mr-1.5" />
                    {business.name}
                  </Link>
                  {reviews.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-bold text-gray-900 mr-1">{averageRating}</span>
                      <span>({reviews.length} reviews)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
                  <span className="text-4xl font-extrabold text-gray-900">₨ {effectivePrice.toLocaleString()}</span>
                  {product.discount_price && (
                    <span className="text-lg text-gray-400 line-through mb-1">₨ {product.price.toLocaleString()}</span>
                  )}
                </div>

                <div className="mb-6">
                  {product.stock_quantity > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-100">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      In Stock ({product.stock_quantity} {product.stock_quantity <= (product.low_stock_threshold || 5) ? 'left — hurry!' : 'available'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-50 text-red-700 border border-red-100">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Description</h3>
                  <div className={`text-gray-600 text-sm leading-relaxed ${!isDescriptionExpanded && 'line-clamp-4'}`}>
                    {product.description || 'No description available.'}
                  </div>
                  {product.description && product.description.length > 200 && (
                    <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-red-600 text-sm font-semibold mt-2 hover:underline">
                      {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                    </button>
                  )}
                </div>
              </div>

              {/* DESKTOP PURCHASE SECTION */}
              <div className="hidden md:block space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-gray-300 rounded-lg h-12 w-32">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-lg transition"><Minus className="w-4 h-4" /></button>
                    <div className="flex-1 h-full flex items-center justify-center font-bold text-gray-900 border-x border-gray-300">{quantity}</div>
                    <button onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-lg transition"><Plus className="w-4 h-4" /></button>
                  </div>

                  {/* Favourite button */}
                  <button
                    onClick={handleToggleFavourite}
                    disabled={isFavLoading}
                    className={`h-12 px-4 border rounded-lg font-medium flex items-center gap-2 transition ${isFavourited ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Heart className={`w-5 h-5 ${isFavourited ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavourited ? 'Saved' : 'Save'}
                  </button>
                </div>

                <PurchaseButton />

                {/* Payment method hint */}
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                  {onlinePayment ? 'eSewa / Khalti / Fonepay accepted' : 'WhatsApp order — fast & direct'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BUSINESS INFO CARD */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {business.logo_url ? <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-gray-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{business.name}</h3>
                {business.is_verified && <ShieldCheck className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4 mr-1" /> {business.address || business.city || 'Nepal'}
              </div>
            </div>
          </div>
          
          <div className="flex w-full md:w-auto gap-3">
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition">
                <Phone className="w-4 h-4" /> Call
              </a>
            )}
            {business.whatsapp && (
              <a href={`https://wa.me/977${business.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1EBE55] rounded-xl font-semibold transition border border-[#25D366]/20">
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            )}
            <Link href={`/businesses/${business.slug}`} className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition">
              Store
            </Link>
          </div>
        </div>

        {/* REVIEWS */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="text-5xl font-extrabold text-gray-900 mb-2">{averageRating || '0'}</div>
              <div className="flex items-center text-yellow-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-6">Based on {reviews.length} reviews</p>
              <button disabled className="w-full bg-gray-900 text-white rounded-lg py-3 font-semibold disabled:opacity-50">Write a Review</button>
              <p className="text-xs text-gray-400 mt-2">Only verified buyers can review</p>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl border border-gray-100 border-dashed p-8 text-center h-full flex flex-col justify-center items-center">
                  <Star className="w-10 h-10 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No reviews yet</h3>
                  <p className="text-gray-500 text-sm mt-1">Be the first to review this product after purchase!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                          {review.profiles?.avatar_url ? <Image src={review.profiles.avatar_url} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-red-100 text-red-600 flex items-center justify-center font-bold">{review.profiles?.full_name?.charAt(0) || 'U'}</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{review.profiles?.full_name || 'Anonymous'}</p>
                          <div className="flex gap-0.5 text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                    {review.title && <h4 className="font-bold text-gray-900 text-sm mb-1">{review.title}</h4>}
                    <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products you may also like</h2>
            <ProductGrid products={relatedProducts} isLoading={false} />
          </div>
        )}

      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 pb-safe">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleFavourite}
            disabled={isFavLoading}
            className={`h-12 w-12 border rounded-xl flex items-center justify-center flex-shrink-0 transition ${isFavourited ? 'bg-red-50 border-red-200' : 'border-gray-200 bg-white'}`}
          >
            <Heart className={`w-5 h-5 ${isFavourited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <div className="flex-1">
            <PurchaseButton mobile />
          </div>
        </div>
      </div>

      {/* GRAB & PAY MODAL */}
      {showGrabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {bookingState === 'form' && (
              <form onSubmit={handleGrabSubmit} className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Reserve Item</h3>
                  <button type="button" onClick={() => setShowGrabModal(false)} className="text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-1"><X className="w-5 h-5"/></button>
                </div>
                <p className="text-gray-600 mb-6 text-sm">Reserve {quantity} x {product.name} now and pay when you visit the store. We'll give you a reservation code.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="98XXXXXXXX" />
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  <button type="submit" className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-red-700 transition">Confirm Reservation</button>
                  <button type="button" onClick={() => setShowGrabModal(false)} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition">Cancel</button>
                </div>
              </form>
            )}
            {bookingState === 'loading' && (
              <div className="p-10 text-center flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Reserving...</h3>
                <p className="text-gray-500 mt-2">Please wait while we secure your item and generate a code.</p>
              </div>
            )}
            {bookingState === 'success' && (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"><Check className="w-8 h-8 text-green-600" /></div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Reservation Confirmed!</h3>
                <p className="text-gray-600 mb-6 font-medium">Your item has been set aside. Please show this code to the merchant at the store to pay and collect.</p>
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 w-full mb-8">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Reservation Code</p>
                  <p className="text-4xl font-black text-gray-900 tracking-wider">{ticketCode}</p>
                </div>
                <button onClick={() => { setShowGrabModal(false); setBookingState('form'); setQuantity(1); router.push('/dashboard/orders'); }} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition">View My Orders</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
