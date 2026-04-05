'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, ShoppingCart, User, MapPin, Menu, X, ChevronDown, LogOut, LayoutDashboard, Bell, Settings, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single()
        if (data) setProfile(data)
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
      if (!session) { setUser(null); setProfile(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '/offers', label: 'Offers 🔥' },
    { href: '/events', label: 'Events' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/businesses', label: 'Businesses' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo + Desktop Nav */}
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-extrabold tracking-tight inline-flex items-center gap-1.5">
                <span className="text-red-600">Biz</span>
                <span className="text-gray-900">Nepal</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mb-3"></span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                      pathname.startsWith(link.href)
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Location Picker */}
              <button className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 transition-colors hover:border-gray-300">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Nepal</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
              </Link>

              {/* Auth Section */}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm border-2 border-red-200 overflow-hidden">
                      {profile?.avatar_url
                        ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                        : (profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()
                      }
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-24 truncate">
                      {profile?.full_name?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in duration-200">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {profile?.role === 'business' && (
                        <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors">
                          <LayoutDashboard className="w-4 h-4" />
                          Business Dashboard
                        </Link>
                      )}
                      {profile?.role === 'admin' && (
                        <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">
                          <ShieldCheck className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      <Link href="/dashboard/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Bell className="w-4 h-4" />
                        My Orders
                      </Link>
                      <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleSignOut} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Register</span>
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white py-3 px-4 space-y-1 animate-in fade-in duration-200">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-2 border-t border-gray-100 flex gap-2">
                <Link href="/login" className="flex-1 text-center py-2.5 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">Sign In</Link>
                <Link href="/register" className="flex-1 text-center py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors shadow-sm">Register</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 pt-14 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="text-xl font-extrabold inline-flex items-center gap-1.5 text-white mb-3">
                <span className="text-red-500">Biz</span>Nepal
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mb-2.5"></span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed">Discover Nepal&apos;s best businesses, products, and opportunities. नेपालको उत्कृष्ट व्यापारहरू।</p>
              <div className="flex gap-3 mt-4">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 hover:bg-blue-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-bold">f</a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 hover:bg-sky-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-bold">𝕏</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-bold">ig</a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/products" className="hover:text-white transition-colors">Products</Link></li>
                <li><Link href="/businesses" className="hover:text-white transition-colors">Business Directory</Link></li>
                <li><Link href="/jobs" className="hover:text-white transition-colors">Job Board</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link href="/offers" className="hover:text-white transition-colors">Deals & Offers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">For Businesses</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">Claim Your Listing</Link></li>
                <li><Link href="/dashboard/subscription" className="hover:text-white transition-colors">Pricing Plans</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Business Dashboard</Link></li>
                <li><Link href="/setup-profile" className="hover:text-white transition-colors">Set Up Profile</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2"><span>📧</span> support@biznepal.com</li>
                <li className="flex items-center gap-2"><span>📞</span> +977 1-4XXXXXX</li>
                <li className="flex items-center gap-2"><span>📍</span> Kathmandu, Nepal</li>
                <li><Link href="/admin" className="hover:text-white transition-colors text-gray-600">Admin</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} BizNepal. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
