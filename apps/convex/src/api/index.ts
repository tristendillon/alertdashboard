import { GeospatialIndex } from '@convex-dev/geospatial'
import { components } from './_generated/api'
import type { Id } from './_generated/dataModel'

export const geospatial = new GeospatialIndex<Id<'hydrants'>>(
  components.geospatial
)
