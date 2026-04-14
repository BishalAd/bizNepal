import { Metadata } from 'next'
import SettingsClient from './SettingsClient'

export const metadata: Metadata = {
  title: 'Profile Settings',
  description: 'Manage your personal profile and account settings',
}

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-2">Manage your personal information, avatar, and security credentials.</p>
      </div>
      <SettingsClient />
    </div>
  )
}
