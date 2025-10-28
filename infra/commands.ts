import { Postgres } from './postgres'

export const generate = new sst.x.DevCommand('db:generate', {
  link: [Postgres],
  dev: {
    command: 'bun run --cwd packages/db db:generate',
    autostart: false,
  },
})

export const migrate = new sst.x.DevCommand('db:migrate', {
  link: [Postgres],
  dev: {
    command: 'bun run --cwd packages/db db:migrate',
    autostart: false,
  },
})

export const push = new sst.x.DevCommand('db:push', {
  link: [Postgres],
  dev: {
    command: 'bun run --cwd packages/db db:push',
    autostart: false,
  },
})

export const studio = new sst.x.DevCommand('db:studio', {
  link: [Postgres],
  dev: {
    command: 'bun run --cwd packages/db db:studio',
  },
})
