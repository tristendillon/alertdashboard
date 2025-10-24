'use client'

import * as React from 'react'
import mqtt from 'mqtt'

interface HeartbeatMessage {
  timestamp: string
  status: string
  successCount: number
  errorCount: number
  duration: string
}

interface CronMonitorProps {
  endpoint: string
  topic: string
  authorizer: string
}

function createConnection(endpoint: string, authorizer: string) {
  return mqtt.connect(
    `wss://${endpoint}/mqtt?x-amz-customauthorizer-name=${authorizer}`,
    {
      protocolVersion: 5,
      manualConnect: true,
      username: '', // Must be empty for the authorizer
      password: 'PLACEHOLDER_TOKEN', // Passed as the token to the authorizer
      clientId: `client_${window.crypto.randomUUID()}`,
    }
  )
}

export function CronMonitor({ endpoint, topic, authorizer }: CronMonitorProps) {
  const [messages, setMessages] = React.useState<HeartbeatMessage[]>([])
  const [connection, setConnection] = React.useState<mqtt.MqttClient | null>(
    null
  )

  React.useEffect(() => {
    const connection = createConnection(endpoint, authorizer)

    connection.on('connect', async () => {
      try {
        await connection.subscribeAsync(topic, { qos: 1 })
        setConnection(connection)
      } catch (e) {
        console.error(e)
      }
    })
    connection.on('message', (_fullTopic, payload) => {
      const message = new TextDecoder('utf8').decode(new Uint8Array(payload))
      const parsedMessage = JSON.parse(message)
      setMessages((prev) => [...prev, parsedMessage])
    })
    connection.on('error', console.error)

    connection.connect()

    return () => {
      connection.end()
      setConnection(null)
    }
  }, [topic, endpoint, authorizer])

  return (
    <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Cron Job Monitor
        </h2>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              connection ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {connection ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Waiting for heartbeat messages...
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className="rounded-md border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(msg.timestamp).toLocaleString()}
                </span>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {msg.status}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Success:
                  </span>{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {msg.successCount}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Errors:
                  </span>{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {msg.errorCount}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Duration:
                  </span>{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {msg.duration}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
