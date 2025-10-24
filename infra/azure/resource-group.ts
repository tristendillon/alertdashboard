import { Resource } from 'sst'

export const ResourceGroup = new azure.core.ResourceGroup('ResourceGroup', {
  name: `${Resource.App.name}-${Resource.App.stage}-resources`,
  location: 'eastus',
}) as azure.core.ResourceGroup
