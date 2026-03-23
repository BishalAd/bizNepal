'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProductGrid from '@/components/products/ProductGrid'
import { Heart, Star, Store, MapPin, Phone, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { useCartStore } from '@/store/cartStore'

const SimpleMap = dynamic(() => import('@/components/ui/SimpleMap'), { 
  ssr: false, 
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" /> 
})

export default function ProductDetailClient({ product, reviews, relatedProducts }: any) {
  const { user } = useAuth()
  const addItem = useCartStore((state) => state.addItem)
  const supabase = createClient()
  
  const placeholder = 'https://placehold.co/600x400?text=BizNepal'
  const [activeImage, setActiveImage] = useState((product.image_keys && product.image_keys[0]) || placeholder)
  const [quantity, setQuantity] = useState(1)
  const [isSaved, setIsSaved] = useState(product.isSaved || false) // Would need actual saved status logic on mount
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const discountPercent = product.discount_price && product.discount_price > product.price
    ? Math.round(((product.discount_price - product.price) / product.discount_price) * 100)
    : null

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.name,
      price: product.price,
      business_id: product.business_id,
      image_url: product.image_keys?.[0] || placeholder
    }, quantity)
    toast.success(`${product.name} added to cart!`)
  }

  const handlePurchase = (method: string) => {
    if (!user) {
      toast.error("Please log in to purchase")
      return
    }
    // Redirect to checkout with params
    const params = new URLSearchParams({
      productId: product.id,
      quantity: quantity.toString(),
      method: method
    })
    window.location.href = `/checkout?${params.toString()}`
  }

  const handleToggleSave = async () => {
    if (!user) {
      toast.error("Please log in to save items")
      return
    }
    
    setIsSaved(!isSaved)
    if (!isSaved) {
      await supabase.from('saved_items').insert({ user_id: user.id, product_id: product.id })
      toast.success("Added to wishlist")
    } else {
      await supabase.from('saved_items').delete().eq('user_id', user.id).eq('product_id', product.id)
      toast.success("Removed from wishlist")
    }
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <>
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb could go here */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            
            {/* IMAGE GALLERY */}
            <div className="p-4 lg:p-8">
              <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 touch-pinch-zoom">
                <Image src={activeImage} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                {discountPercent && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg z-10">
                    {discountPercent}% OFF
                  </div>
                )}
              </div>
              {product.image_keys?.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
                  {product.image_keys.map((img: string, idx: number) => (
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
                  <Link href={`/businesses/${product.business.slug}`} className="flex items-center text-sm font-medium text-red-600 hover:text-red-700">
                    <Store className="w-4 h-4 mr-1.5" />
                    {product.business.name}
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
                  <span className="text-4xl font-extrabold text-gray-900">₨ {product.price.toLocaleString()}</span>
                  {product.discount_price && (
                    <span className="text-lg text-gray-400 line-through mb-1">₨ {product.discount_price.toLocaleString()}</span>
                  )}
                </div>

                <div className="mb-6">
                  {product.stock_quantity > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-100">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      In Stock ({product.stock_quantity} {product.stock_quantity <= (product.low_stock_threshold || 5) ? 'left - hurry!' : 'available'})
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
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-gray-300 rounded-lg h-12 w-32">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-lg transition"><Minus className="w-4 h-4" /></button>
                    <div className="flex-1 h-full flex items-center justify-center font-bold text-gray-900 border-x border-gray-300">{quantity}</div>
                    <button onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-lg transition"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={handleToggleSave} className={`h-12 px-4 border ${isSaved ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg font-medium flex items-center gap-2 transition`}>
                    <Heart className={`w-5 h-5 ${isSaved && 'fill-red-500'}`} />
                    {isSaved ? 'Saved' : 'Wishlist'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity <= 0}
                    className="h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none"
                  >
                    <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition" />
                    Add to Cart
                  </button>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 opacity-60">
                     <p className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Other Options Available at Checkout</p>
                     <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                        <Check className="w-3 h-3 text-green-500" /> eSewa / Khalti
                     </div>
                     <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                        <Check className="w-3 h-3 text-green-500" /> Cash on Delivery
                     </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* BUSINESS INFO CARD */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.business.logo_url ? <img src={product.business.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-gray-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{product.business.name}</h3>
                {product.business.is_verified && <ShieldCheck className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4 mr-1" /> {product.business.address || product.business.city || 'Nepal'}
              </div>
            </div>
          </div>
          
          <div className="flex w-full md:w-auto gap-3">
            {product.business.phone && (
              <a href={`tel:${product.business.phone}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition">
                <Phone className="w-4 h-4" /> Call
              </a>
            )}
            {product.business.whatsapp && (
              <a href={`https://wa.me/977${product.business.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1EBE55] rounded-xl font-semibold transition border border-[#25D366]/20">
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            )}
            <Link href={`/businesses/${product.business.slug}`} className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition">
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
              
              <button disabled className="w-full bg-gray-900 text-white rounded-lg py-3 font-semibold disabled:opacity-50">
                Write a Review
              </button>
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
                reviews.map((review: any) => (
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
                    {review.owner_reply && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Business Reply</span>
                        </div>
                        <p className="text-sm text-gray-600 italic">"{review.owner_reply}"</p>
                      </div>
                    )}
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
          <div className="w-20">
            <div className="text-xs text-gray-500 font-medium">Total</div>
            <div className="font-bold text-gray-900 text-lg leading-none">₨ {(product.price * quantity).toLocaleString()}</div>
          </div>
          <button onClick={() => handlePurchase('buy_now')} className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-sm text-center">
            Buy Now
          </button>
        </div>
      </div>
    </>
  )
}
