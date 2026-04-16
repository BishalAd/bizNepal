'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Loader2, User as UserIcon, Upload, KeyRound, Shield } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function SettingsClient() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('')
  
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || user.user_metadata?.full_name || '')
        setWhatsapp(profile.whatsapp || user.user_metadata?.phone || '')
        setCurrentAvatarUrl(profile.avatar_url || '')
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let finalAvatarUrl = currentAvatarUrl

      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar)
          
        if (uploadError) throw uploadError
        
        if (data) {
          const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(fileName)
          finalAvatarUrl = pubData.publicUrl
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          whatsapp: whatsapp,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError
      
      setCurrentAvatarUrl(finalAvatarUrl)
      toast.success('Profile information updated successfully!')
      router.refresh()
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }
    
    setIsPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      toast.success('Password updated securely!')
      setNewPassword('')
    } catch (error: any) {
      toast.error('Failed to update password: ' + error.message)
    } finally {
      setIsPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Toaster position="top-right" />
      
      {/* Profile Details Form */}
      <form onSubmit={handleProfileSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold flex items-center justify-between border-b border-gray-100 pb-4">
          Personal Information
          <button 
            type="submit" 
            disabled={isSaving}
            className="text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition flex items-center disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
            Save Info
          </button>
        </h2>

        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
               {avatar ? (
                 <img src={URL.createObjectURL(avatar)} alt="New Avatar" className="w-full h-full object-cover" />
               ) : currentAvatarUrl ? (
                 <img src={currentAvatarUrl} alt="Current Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-10 h-10 text-gray-400" />
               )}
            </div>
            <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-red-600 text-white p-2 rounded-xl cursor-pointer hover:bg-red-700 transition shadow-sm border-2 border-white">
              <Upload className="w-4 h-4" />
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => setAvatar(e.target.files?.[0] || null)} 
              />
            </label>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Profile Avatar</p>
            <p className="text-xs text-gray-500 mt-0.5">We recommend a square image,<br/>at least 400x400px.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
          <input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            className="w-full px-4 py-3 bg-gray-100/70 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed" 
          />
          <p className="text-xs text-gray-400 mt-1.5 font-medium">To change your email, please contact support.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Full Name</label>
          <input 
            type="text" 
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none rounded-xl font-medium transition" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">WhatsApp Number</label>
          <input 
            type="text" 
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+977"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none rounded-xl font-medium transition" 
          />
        </div>
      </form>

      {/* Security Form */}
      <form onSubmit={handlePasswordSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold flex items-center justify-between border-b border-gray-100 pb-4">
          Security Settings
          <button 
            type="submit" 
            disabled={isPasswordSaving || !newPassword}
            className="text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition flex items-center disabled:opacity-50"
          >
            {isPasswordSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Shield className="w-4 h-4 mr-1.5" />}
            Update Password
          </button>
        </h2>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">New Password</label>
          <div className="relative">
             <KeyRound className="absolute left-4 top-[14px] w-5 h-5 text-gray-400" />
             <input 
               type="password" 
               required
               minLength={6}
               placeholder="Minimum 6 characters"
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-xl font-medium transition" 
             />
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">For maximum security, avoid using easily guessable passwords like birthdays, simple words, or names.</p>
        </div>
      </form>

    </div>
  )
}
