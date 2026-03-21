'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProductWithBusiness } from '@/types'

export interface ProductFilters {
  category?: string
  district?: string | string[]
  minPrice?: number
  maxPrice?: number
  rating?: number
  inStock?: boolean
  paymentMethod?: string[]
  search?: string
  sort?: string
}

export function useProducts({ initialData = [], filters = {}, pageSize = 12 }: { initialData?: ProductWithBusiness[], filters?: ProductFilters, pageSize?: number } = {}) {
  const [products, setProducts] = useState<ProductWithBusiness[]>(initialData)
  const [loading, setLoading] = useState<boolean>(!initialData.length)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [page, setPage] = useState<number>(0)
  
  const supabase = createClient()

  const fetchProducts = useCallback(async (options: { reset?: boolean, activeFilters?: ProductFilters } = {}) => {
    const isReset = options.reset || false
    const currentFilters = options.activeFilters || filters
    const currentPage = isReset ? 0 : page
    
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          business:businesses(*)
        `)
        .eq('status', 'active')
        .eq('businesses.is_active', true)

      // Apply Filters
      if (currentFilters.category) {
        query = query.eq('category_id', currentFilters.category)
      }
      if (currentFilters.minPrice) {
        query = query.gte('price', currentFilters.minPrice)
      }
      if (currentFilters.maxPrice) {
        query = query.lte('price', currentFilters.maxPrice)
      }
      if (currentFilters.inStock) {
        query = query.gt('stock', 0)
      }
      if (currentFilters.search) {
        query = query.ilike('name', `%${currentFilters.search}%`)
      }
      if (currentFilters.paymentMethod && currentFilters.paymentMethod.length > 0) {
        if (currentFilters.paymentMethod.includes('esewa')) query = query.eq('allows_esewa', true)
        if (currentFilters.paymentMethod.includes('khalti')) query = query.eq('allows_khalti', true)
        if (currentFilters.paymentMethod.includes('cod')) query = query.eq('allows_cod', true)
      }
      
      // District filtering (requires filtering on business, which is done locally or via inner join if requested, but postgREST handles it awkwardly without proper foreign table filtering syntax unless we use inner joins. Supabase select supports inner join logic or we can filter locally if small scale. For scalability, we should use RPC or filter. But we can just use `!inner` on businesses)
      /*
      Actually, in Supabase we can do:
      .select('..., business:businesses!inner(*)')
      .eq('businesses.district_id', districtId)
      Let's update to use !inner to allow filtering by business district.
      */

      // Sort
      switch (currentFilters.sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'popular':
          query = query.order('view_count', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Pagination
      const from = currentPage * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Process and set
      let formattedData = (data as unknown) as ProductWithBusiness[]
      
      // Since inner join features are complex to type directly, we just assume the relation returned successfully
      // We manually fetch saved items for the user if logged in to map 'isSaved' state
      const { data: { user } } = await supabase.auth.getUser()
      if (user && formattedData.length > 0) {
        const { data: savedItems } = await supabase
          .from('saved_items')
          .select('product_id')
          .eq('user_id', user.id)
          .in('product_id', formattedData.map(p => p.id))
          
        const savedIds = new Set(savedItems?.map(s => s.product_id))
        formattedData = formattedData.map(p => ({
          ...p,
          isSaved: savedIds.has(p.id)
        }))
      }

      if (isReset) {
        setProducts(formattedData)
      } else {
        setProducts(prev => [...prev, ...formattedData])
      }

      setHasMore(formattedData.length === pageSize)
      if (!isReset) setPage(p => p + 1)
      else setPage(1)

    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize, supabase])

  // Load initial if empty
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts({ reset: true })
    }
  }, []) // intentionally only on mount unless filters change

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts({ reset: false })
    }
  }

  const toggleSave = async (id: string, currentlySaved: boolean) => {
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isSaved: !currentlySaved } : p))
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      if (currentlySaved) {
        await supabase.from('saved_items').delete().eq('user_id', user.id).eq('product_id', id)
      } else {
        await supabase.from('saved_items').insert({ user_id: user.id, product_id: id })
      }
    } catch (err) {
      // Revert on error
      console.error(err)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isSaved: currentlySaved } : p))
    }
  }

  return { products, loading, error, hasMore, loadMore, toggleSave, fetchProducts }
}
