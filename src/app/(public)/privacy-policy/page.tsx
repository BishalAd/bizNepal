import React from 'react'

export const metadata = {
  title: 'Privacy Policy | Biznity',
  description: 'Privacy Policy and Data Handling for Biznity.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</p>
        
        <div className="prose prose-red max-w-none text-gray-600">
          <p>
            At Biznity, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you:</p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Create an account or business profile (Name, Email, Phone Number, Business Details).</li>
            <li>Connect third-party services (e.g., Google login, Telegram Bot integration).</li>
            <li>Interact with the platform (Placing orders, writing reviews, applying for jobs).</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Provide, maintain, and improve our services.</li>
            <li>Process transactions and send related information, including confirmations and receipts.</li>
            <li>Send technical notices, updates, security alerts, and support messages.</li>
            <li>Facilitate communication between businesses and customers (e.g., job applications or order inquiries).</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal data to third parties. We may share your information only in the following scenarios:
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li><strong>With Businesses:</strong> If you place an order, apply for a job, or book an event, your relevant contact details are shared with that specific business to fulfill the request.</li>
            <li><strong>Service Providers:</strong> We share data with trusted third-party providers (like Supabase, email delivery services, and payment gateways) necessary to operate our platform securely.</li>
            <li><strong>Legal Requirements:</strong> If required by law, we may disclose your information to comply with legal processes or government requests.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
          <p>
            We implement industry-standard security measures (including Row Level Security in our database and encrypted transmission) to protect your personal information from unauthorized access, alteration, or destruction.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. You can do this via your account settings dashboard or by contacting our support team.
          </p>
        </div>
      </div>
    </div>
  )
}
