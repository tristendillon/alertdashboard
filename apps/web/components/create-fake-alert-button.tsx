'use client'

import { useCreateAlert } from '@/hooks/use-alerts'
import { generateFakeAlert } from '@/lib/fake-alert-generator'

export function CreateFakeAlertButton() {
  const createAlert = useCreateAlert()

  const handleCreateFakeAlert = () => {
    const fakeAlert = generateFakeAlert()
    createAlert.mutate(fakeAlert)
  }

  return (
    <button
      onClick={handleCreateFakeAlert}
      disabled={createAlert.isPending}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {createAlert.isPending ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Creating...
        </span>
      ) : (
        'Create Fake Alert'
      )}
    </button>
  )
}
