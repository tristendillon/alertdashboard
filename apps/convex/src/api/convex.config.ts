// convex/convex.config.ts
import geospatial from '@convex-dev/geospatial/convex.config'
import aggregate from '@convex-dev/aggregate/convex.config'
import { defineApp } from 'convex/server'

const app = defineApp()

app.use(geospatial)
app.use(aggregate)

export default app
