# @alertdashboard/firstdue-sdk

FirstDue API Client SDK for the Alert Dashboard monorepo.

## Installation

This package is part of the monorepo and should be added as a dependency in other workspace packages.

## Usage

```typescript
import { FirstDueClient } from '@alertdashboard/firstdue-sdk'

// Initialize the client
const client = new FirstDueClient({
  apiUrl: process.env.FIRSTDUE_API_URL!,
  apiKey: process.env.FIRSTDUE_API_KEY!,
  timeout: 30000, // optional, defaults to 30s
})

// Fetch alerts
const response = await client.getAlerts({
  startDate: '2025-10-23T00:00:00Z',
  type: 'fire',
  limit: 50,
})

if (response.success) {
  console.log('Alerts:', response.data)
} else {
  console.error('Error:', response.error)
}

// Fetch single alert
const alert = await client.getAlertById('alert-123')
```

## TODO

This is a scaffold SDK. You need to:

1. Update `types.ts` with actual FirstDue API response structures
2. Update authentication header format in `client.ts` (currently uses Bearer token)
3. Add/modify endpoints based on FirstDue API documentation
4. Add additional methods for other FirstDue resources (incidents, units, stations, etc.)

## Development

```bash
# Build the package
bun run build

# Use in other packages
# Add to package.json dependencies:
# "@alertdashboard/firstdue-sdk": "workspace:*"
```
