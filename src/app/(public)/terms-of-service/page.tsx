import React from 'react'

export const metadata = {
  title: 'Terms of Service | Biznity',
  description: 'Terms of Service and User Agreement for Biznity.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</p>
        
        <div className="prose prose-red max-w-none text-gray-600">
          <p>
            Welcome to Biznity. By accessing or using our platform, you agree to be bound by these Terms of Service. 
            Please read them carefully before using our services.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By registering an account, listing a business, or simply browsing the Biznity platform, you agree to comply with and be bound by these Terms. 
            If you do not agree to these Terms, please refrain from using our services.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. User Accounts & Business Listings</h2>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>You must provide accurate and complete information when creating an account or business listing.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>Biznity reserves the right to suspend or terminate accounts that violate our policies or provide false information.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Content & Intellectual Property</h2>
          <p>
            When you upload content (images, descriptions, reviews) to Biznity, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content to promote your business and the platform. 
            You retain all ownership rights to your original content.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Platform Fees & Subscriptions</h2>
          <p>
            While creating a basic business profile is free, certain premium features require a paid subscription. All subscription fees are clearly stated at checkout. Payments are processed securely via third-party gateways (e.g., eSewa, Khalti, Stripe). Subscriptions are generally non-refundable unless required by law.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Limitation of Liability</h2>
          <p>
            Biznity acts as a directory and connection platform. We do not guarantee the quality, safety, or legality of any products, services, or events listed by third-party businesses. Any transactions or disputes are strictly between the user and the business.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Changes to Terms</h2>
          <p>
            We may update these terms occasionally to reflect changes in our services or legal requirements. We will notify users of significant changes, but it is your responsibility to review these terms periodically.
          </p>
        </div>
      </div>
    </div>
  )
}
