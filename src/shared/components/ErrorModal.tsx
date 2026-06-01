import React from 'react'

type Props = {
  title: string
  message: string
  details?: string
  onClose: () => void
}

export default function ErrorModal({ title, message, details, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-4 w-full max-w-md">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">❌</span>
          <h2 className="text-lg font-bold text-red-700">{title}</h2>
        </div>

        {/* Message */}
        <div className="mb-3 p-3 bg-red-50 rounded border border-red-200">
          <p className="text-sm text-red-800">{message}</p>
          {details && (
            <div className="text-xs text-red-600 mt-2 max-h-32 overflow-y-auto">
              {details}
            </div>
          )}
        </div>

        {/* Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-sm btn-primary"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
