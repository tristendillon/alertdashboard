import { realtime } from 'sst/aws/realtime'
import { Resource } from 'sst'

export const handler = realtime.authorizer(async (token) => {
  const prefix = `${Resource.App.name}/${Resource.App.stage}`

  const isValid = token === 'PLACEHOLDER_TOKEN'

  return isValid
    ? {
        publish: [`${prefix}/*`],
        subscribe: [`${prefix}/*`],
      }
    : {
        publish: [],
        subscribe: [],
      }
})
