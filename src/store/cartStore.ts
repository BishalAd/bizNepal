import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  title: string
  price: number
  business_id: string
  quantity: number
  image_url?: string
}

interface CartState {
  items: CartItem[]
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalAmount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(i => i.id === product.id)
          if (existing) {
            return { items: state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i) }
          }
          return { items: [...state.items, { ...product, quantity }] }
        })
      },
      
      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter(i => i.id !== productId) }))
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return
        set((state) => ({ items: state.items.map(i => i.id === productId ? { ...i, quantity } : i) }))
      },
      
      clearCart: () => set({ items: [] }),
      
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      
      totalAmount: () => get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    }),
    {
      name: 'biznity-cart-storage'
    }
  )
)
