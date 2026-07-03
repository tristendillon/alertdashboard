import { ConvexClient } from 'convex/browser'

const client = (url: string) => {
  return new ConvexClient(url)
}

export { client }
