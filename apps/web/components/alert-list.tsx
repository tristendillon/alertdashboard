'use client'

import { useAlerts } from '@/hooks/use-alerts'
import type { Alert } from '@alertdashboard/schemas'

const severityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

function AlertCard({ alert }: { alert: Alert }) {
  const severity = alert.alertData.severity
  const location = alert.alertData.location
  const timestamp = new Date(alert.timestamp).toLocaleString()

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {alert.alertData.title}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${severityColors[severity]}`}
        >
          {severity.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      {alert.alertData.description && (
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          {alert.alertData.description}
        </p>
      )}

      {/* Details */}
      <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-500">
        {location && (
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>
              {location.address && `${location.address}, `}
              {location.city && `${location.city}, `}
              {location.state}
            </span>
          </div>
        )}

        {alert.alertData.incidentType && (
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span>{alert.alertData.incidentType}</span>
          </div>
        )}

        {alert.alertData.units && alert.alertData.units.length > 0 && (
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>{alert.alertData.units.join(', ')}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{timestamp}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span className="font-mono">{alert.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  )
}

export function AlertList() {
  const { data, isLoading, error } = useAlerts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-semibold">Error loading alerts</p>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          No alerts yet. Create a fake alert to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Recent Alerts
        </h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {data.items.length} alert{data.items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid gap-4">
        {data.items.map((alert) => (
          <AlertCard key={`${alert.id}-${alert.timestamp}`} alert={alert} />
        ))}
      </div>
    </div>
  )
}
