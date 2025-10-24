import { Resource } from 'sst'
import { ResourceGroup } from './resource-group'

export const FlexibleServer = new azure.postgresql.FlexibleServer(
  'FlexibleServer',
  {
    name: `${Resource.App.name}-${Resource.App.stage}-flexible-server`,
    resourceGroupName: ResourceGroup.name,
    location: ResourceGroup.location,
    version: '12',
    administratorLogin: process.env.AZURE_FLEXIBLE_SERVER_USERNAME,
    administratorPassword: process.env.AZURE_FLEXIBLE_SERVER_PASSWORD,
    storageMb: 32768,
    skuName: 'Standard_B1ms',
  }
) as azure.postgresql.FlexibleServer

export const Database = new azure.postgresql.FlexibleServerDatabase(
  'Database',
  {
    name: `${Resource.App.name}-${Resource.App.stage}-database`,
    serverId: FlexibleServer.id,
  }
) as azure.postgresql.FlexibleServerDatabase
