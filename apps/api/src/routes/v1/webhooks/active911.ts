import { Hono } from 'hono'

const active911 = new Hono().post('/', (c) => {
  return c.json({ message: 'Active911 webhook received' })
})

export default active911
