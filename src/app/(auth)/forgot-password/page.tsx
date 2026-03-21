'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth/actions'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await resetPassword(formData)
    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result?.success) {
      setMessage({ type: 'success', text: result.success })
    }
    
    setIsLoading(false)
  }

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Reset password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:rounded-lg sm:px-10 border border-gray-100 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div className={`px-4 py-3 rounded-md text-sm border ${
                message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                {message.text}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center rounded-md border border-transparent bg-red-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Send reset link
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <Link href="/login" className="font-semibold text-gray-600 hover:text-gray-900">
              &larr; Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
