'use client'

import Link from 'next/link'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-unimore-blue/20 to-unimore-blue/10 rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-unimore-blue" />
          </div>
          <h1 className="text-6xl font-bold text-unimore-navy mb-2 font-century">404</h1>
          <h2 className="text-2xl font-semibold text-unimore-navy mb-4">Page Not Found</h2>
          <p className="text-unimore-navy/60 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-unimore-blue to-unimore-blue-light text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-unimore-blue/20 text-unimore-navy rounded-lg hover:bg-unimore-blue/5 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}