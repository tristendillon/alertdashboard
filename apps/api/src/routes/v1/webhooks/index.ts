import { Hono } from 'hono'
import active911 from './active911'

const webhooks = new Hono().route('/active911', active911)

export default webhooks
