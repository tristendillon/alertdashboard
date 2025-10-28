import { Hono } from 'hono'

const active911 = new Hono().post('/', async (c) => {
  const headers = c.req.header()
  const body = await c.req.json()
  console.log('Headers: ', headers)
  console.log('Body: ', JSON.stringify(body, null, 2))
  return c.json({ message: 'Active911 webhook received' })
})

export default active911
