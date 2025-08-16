'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Application Error</h2>
            <p className="text-gray-600 mb-6">
              A critical error occurred. Please refresh the page or contact support.
            </p>
            <button 
              onClick={reset} 
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
} 