import Image from 'next/image'
import { CronMonitor } from './components/cron-monitor'
import { Resource } from 'sst'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Alert Dashboard
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Monitor your FirstDue alert sync in real-time.
          </p>
          <CronMonitor
            endpoint={Resource.Realtime.endpoint}
            topic={`${Resource.App.name}/${Resource.App.stage}/cron/heartbeat`}
            authorizer={Resource.Realtime.authorizer}
          />
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Real-time updates powered by AWS IoT and SST
        </div>
      </main>
    </div>
  )
}
