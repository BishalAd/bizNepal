'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, MessageCircle, Store, Trash2, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { hasOnlinePayment, buildWhatsAppUrl } from '@/lib/payments'

interface FavItem {
  favouriteId: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    discount_price?: number | null
    image_keys?: string[] | null
    stock_quantity: number
    status: string
  }
  business: {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    whatsapp?: string | null
    khalti_merchant_id?: string | null
    esewa_merchant_id?: string | null
    fonepay_merchant_code?: string | null
  }
}

interface GroupedFavs {
  [bizId: string]: {
    business: FavItem['business']
    items: FavItem[]
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://biz-nepal.vercel.app'
const placeholder = 'https://placehold.co/400x400?text=BizNepal'

export default function FavouritesClient({ grouped: initialGrouped, userId }: {
  grouped: GroupedFavs
  userId: string
}) {
  const supabase = createClient()
  const [grouped, setGrouped] = useState<GroupedFavs>(initialGrouped)
  const [removing, setRemoving] = useState<string | null>(null) // favouriteId being removed

  const totalItems = Object.values(grouped).reduce((s, g) => s + g.items.length, 0)

  /** Remove a single favourite */
  const handleRemove = useCallback(async (favouriteId: string, productId: string, bizId: string) => {
    setRemoving(favouriteId)
    const { error } = await supabase.from('favourites').delete().eq('id', favouriteId)
    if (error) {
      toast.error('Could not remove item')
    } else {
      setGrouped(prev => {
        const updated = { ...prev }
        const group = { ...updated[bizId] }
        group.items = group.items.filter(i => i.favouriteId !== favouriteId)
        if (group.items.length === 0) {
          delete updated[bizId]
        } else {
          updated[bizId] = group
        }
        return updated
      })
      toast.success('Removed from favourites')
    }
    setRemoving(null)
  }, [supabase])

  /** WhatsApp single product */
  const whatsAppSingle = (item: FavItem) => {
    const { business, product } = item
    if (!business.whatsapp) return
    const price = product.discount_price ?? product.price
    const msg = `Hi, I'm interested in buying:\n*${product.name}* — NPR ${price.toLocaleString()}\nLink: ${APP_URL}/products/${product.slug}`
    window.open(buildWhatsAppUrl(business.whatsapp, msg), '_blank')
  }

  /** WhatsApp bulk buy (same business) */
  const whatsAppBulk = (group: GroupedFavs[string]) => {
    const { business, items } = group
    if (!business.whatsapp) return
    const lines = items.map(i => `• ${i.product.name} — NPR ${(i.product.discount_price ?? i.product.price).toLocaleString()}`)
    const msg = `Hi! I want to buy the following from *${business.name}*:\n${lines.join('\n')}\n\nPlease confirm availability.`
    window.open(buildWhatsAppUrl(business.whatsapp, msg), '_blank')
  }

  /** Online checkout for a single product */
  const buyNow = (productId: string) => {
    window.location.href = `/checkout?productId=${productId}`
  }

  /** Online checkout for multiple products from same business */
  const buyAll = (items: FavItem[]) => {
    const ids = items.map(i => i.product.id).join(',')
    const bizId = items[0].business.id
    window.location.href = `/checkout?productIds=${ids}&businessId=${bizId}`
  }

  if (totalItems === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-12 h-12 text-red-200" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">No favourites yet</h1>
        <p className="text-gray-500 text-lg mb-8">You haven&apos;t saved any products yet. Start exploring!</p>
        <Link href="/products" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-red-600/20">
          <Package className="w-5 h-5" /> Browse Products →
        </Link>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <Heart className="w-8 h-8 fill-red-500 text-red-500" />
              My Favourites
            </h1>
            <p className="text-gray-500 mt-1">{totalItems} saved product{totalItems !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-red-600 hover:underline">
            Browse more →
          </Link>
        </div>

        {/* Grouped by business */}
        <div className="space-y-10">
          {Object.entries(grouped).map(([bizId, group]) => {
            const { business, items } = group
            const groupOnlinePayment = hasOnlinePayment(business)
            const multipleItems = items.length >= 2

            return (
              <div key={bizId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Business header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <Link href={`/businesses/${business.slug}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                      {business.logo_url
                        ? <img src={business.logo_url} alt="" className="w-full h-full object-cover" />
                        : <Store className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-red-600 transition">{business.name}</p>
                      <p className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
                    </div>
                  </Link>

                  {/* Buy All button for 2+ items from same business */}
                  {multipleItems && (
                    <div>
                      {groupOnlinePayment ? (
                        <button
                          onClick={() => buyAll(items)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm shadow-red-600/20"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Buy All from {business.name}
                        </button>
                      ) : business.whatsapp ? (
                        <button
                          onClick={() => whatsAppBulk(group)}
                          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Buy All via WhatsApp
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Product cards */}
                <div className="divide-y divide-gray-50">
                  {items.map(item => {
                    const { product } = item
                    const thumb = product.image_keys?.[0] || placeholder
                    const price = product.discount_price ?? product.price
                    const inStock = product.stock_quantity > 0 && product.status === 'active'

                    return (
                      <div key={item.favouriteId} className="flex items-center gap-4 p-4 sm:p-5">
                        {/* Image */}
                        <Link href={`/products/${product.slug}`} className="flex-shrink-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative">
                            <Image src={thumb} alt={product.name} fill sizes="96px" className="object-cover" />
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${product.slug}`}>
                            <h3 className="font-bold text-gray-900 truncate hover:text-red-600 transition">{product.name}</h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-extrabold text-gray-900">₨ {price.toLocaleString()}</span>
                            {product.discount_price && (
                              <span className="text-sm text-gray-400 line-through">₨ {product.price.toLocaleString()}</span>
                            )}
                          </div>
                          <div className="mt-1">
                            {inStock
                              ? <span className="text-xs text-green-600 font-semibold">In Stock</span>
                              : <span className="text-xs text-red-500 font-semibold">Out of Stock</span>
                            }
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {inStock ? (
                            groupOnlinePayment ? (
                              <button
                                onClick={() => buyNow(product.id)}
                                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-3 py-2 rounded-lg transition"
                              >
                                <ShoppingBag className="w-4 h-4" />
                                <span className="hidden sm:inline">Buy Now</span>
                              </button>
                            ) : business.whatsapp ? (
                              <button
                                onClick={() => whatsAppSingle(item)}
                                className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5a] text-white text-sm font-bold px-3 py-2 rounded-lg transition"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">Contact business</span>
                            )
                          ) : null}

                          {/* Remove */}
                          <button
                            onClick={() => handleRemove(item.favouriteId, product.id, bizId)}
                            disabled={removing === item.favouriteId}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition disabled:opacity-40"
                          >
                            {removing === item.favouriteId
                              ? <span className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
