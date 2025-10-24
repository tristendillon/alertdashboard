import { Hono } from 'hono'
import alerts from './alerts'
import health from './health'

const v1 = new Hono().route('/alerts', alerts).route('/health', health)

export default v1
