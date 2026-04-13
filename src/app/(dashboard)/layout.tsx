'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Store, ShoppingBag, Briefcase, CalendarCheck,
  Bell, LogOut, Menu, X, Package, Tag, Star, BarChart2,
  MessageSquare, Settings, ExternalLink, User, ChevronRight
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Business Profile', href: '/dashboard/profile', icon: Store },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Offers & Deals', href: '/dashboard/offers', icon: Tag },
  { name: 'Events', href: '/dashboard/events', icon: CalendarCheck },
  { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { name: 'Applications', href: '/dashboard/applications', icon: User },
  { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Subscription', href: '/dashboard/subscription', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [business, setBusiness] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [notifCount, setNotifCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // 1. Initial Auth & Role Check (runs once on mount)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single()

      if (!profileData || (profileData.role !== 'business' && profileData.role !== 'admin')) {
        router.replace('/setup-profile')
        return
      }
      setProfile(profileData)
    }
    checkAuth()
  }, [])

  // 2. Fetch Business Data & Metadata (runs when pathname changes)
  useEffect(() => {
    const loadBusiness = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      const { data: bizData } = await supabase
        .from('businesses')
        .select('id, name, slug, logo_url, is_open')
        .eq('owner_id', currentUser.id)
        .single()

      if (bizData) {
        // Fetch low stock products count (<= 10)
        const { count: lowStockCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', bizData.id)
          .lte('stock_quantity', 10)

        setBusiness({ ...bizData, lowStockCount: lowStockCount || 0 })

        // Fetch unread notifications
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', bizData.id)
          .is('is_read', false)
        setNotifCount(count || 0)
      }
    }
    loadBusiness()

    // Real-time subscription - simple channel name
    const channel = supabase.channel('sidebar_business_sync_realtime')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'businesses' 
      }, (payload: any) => {
        // If the update is for our current business, update the state
        setBusiness((prev: any) => {
          if (prev && payload.new.id === prev.id) {
            return { ...prev, ...payload.new }
          }
          return prev
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pathname])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand */}
      <div className="p-5 border-b border-gray-100 bg-white">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <span className="text-xl font-extrabold tracking-tighter italic"><span className="text-red-600">Biz</span><span className="text-gray-900">Nepal</span></span>
          <span className="bg-red-50 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded uppercase border border-red-100">Pro</span>
        </Link>
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0 shadow-sm border border-blue-600">
            {business?.logo_url
              ? <img src={business.logo_url} className="w-full h-full object-cover" alt="" />
              : (business?.name?.charAt(0) || 'B')
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-sm truncate">{business?.name || 'Your Business'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className={`w-2 h-2 rounded-full ${business?.is_open !== false ? 'bg-green-500' : 'bg-gray-400 animate-pulse'}`}></span>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{business?.is_open !== false ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {/* SHOP STATUS TOGGLE */}
        <div className="px-3 py-3 mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Store Status</span>
              <button 
                onClick={async () => {
                  const newState = business?.is_open === false ? true : false
                  setBusiness({...business, is_open: newState})
                  await supabase.from('businesses').update({ is_open: newState }).eq('id', business.id)
                  toast.success(newState ? 'Store is now LIVE' : 'Store is now OFFLINE')
                }}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${business?.is_open !== false ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${business?.is_open !== false ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
           </div>
           <p className="text-[10px] leading-tight text-gray-400 font-medium italic">
             {business?.is_open !== false ? 'Visible to public' : 'Products hidden from store'}
           </p>
        </div>

        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all group ${
                isActive
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span className="flex-1">{item.name}</span>
              {item.name === 'Notifications' && notifCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
              {item.name === 'Products' && business?.lowStockCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200`}>
                  {business.lowStockCount} Low
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 space-y-1 bg-gray-50/50">
        {business?.slug && (
          <a
            href={`/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-white transition-all border border-transparent hover:border-gray-200"
          >
            <ExternalLink className="w-4 h-4" /> View Shop
          </a>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex">
      <Toaster position="top-right" />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-full z-20 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 w-72 bg-white z-40 shadow-2xl transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-3 right-3">
          <button onClick={() => setMobileOpen(false)} className="p-2 bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">
                  {navItems.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/dashboard/notifications" className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </Link>

              {/* Profile avatar */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                    : (profile?.full_name?.charAt(0) || 'U').toUpperCase()
                  }
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                  {profile?.full_name?.split(' ')[0] || 'User'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
