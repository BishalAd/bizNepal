import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-red-800 text-white flex-col justify-between overflow-hidden">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('/nepal-pattern.svg')] bg-repeat"></div>
        
        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col h-full justify-between">
          <div>
            <Link href="/" className="text-3xl font-bold tracking-tight inline-flex items-center gap-2">
              <span className="text-white">Biznity</span>
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1"></span>
            </Link>
            <h1 className="mt-12 text-5xl font-extrabold tracking-tight leading-tight">
              Empowering Nepal&apos;s <br />
              <span className="text-red-300">Digital Economy</span>
            </h1>
            <p className="mt-6 text-lg text-red-100 max-w-md">
              Join the largest network of verified businesses, exclusive deals, and local opportunities across all 77 districts.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <blockquote className="text-lg italic text-red-50">
              "Biznity helped my small handicraft store in Patan reach customers all over the country. The platform is incredibly easy to use."
            </blockquote>
            <div className="mt-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-300 flex items-center justify-center text-red-800 font-bold">
                P
              </div>
              <div>
                <p className="font-semibold text-white">Prabina Shrestha</p>
                <p className="text-sm text-red-200">Owner, Patan Crafts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="text-3xl font-bold tracking-tight inline-flex items-center gap-2 text-gray-900">
              Biznity
              <span className="w-2 h-2 rounded-full bg-red-600 mt-1"></span>
            </Link>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
