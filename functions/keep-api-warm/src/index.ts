import { Resource } from 'sst'

/**
 * Keep API Warm Handler
 * Pings the API health endpoint every 5 minutes to prevent cold starts
 */
export const handler = async () => {
  try {
    const apiUrl = Resource.Api.url
    const healthEndpoint = `${apiUrl}/v1/health`

    console.log(`Pinging API health endpoint: ${healthEndpoint}`)

    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'KeepApiWarm/1.0',
      },
    })

    if (!response.ok) {
      console.error(
        `Health check failed: ${response.status} ${response.statusText}`
      )
      return {
        statusCode: response.status,
        body: JSON.stringify({
          success: false,
          message: 'Health check failed',
          status: response.status,
        }),
      }
    }

    const data = await response.json()
    console.log('Health check successful:', data)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'API is warm',
        healthCheck: data,
      }),
    }
  } catch (error) {
    console.error('Error pinging API:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Error pinging API',
        error: error instanceof Error ? error.message : String(error),
      }),
    }
  }
}
