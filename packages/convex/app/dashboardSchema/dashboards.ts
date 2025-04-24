import { crud } from 'convex-helpers/server/crud'
import { queryWithRLS, mutationWithRLS } from '@workspace/convex/middleware/rls'
import schema from '../schema'

export const {
  update: updateDashboard,
  destroy: deleteDashboard,
  create: createDashboard,
  read: readDashboard,
} = crud(schema, 'dashboards', queryWithRLS, mutationWithRLS)
