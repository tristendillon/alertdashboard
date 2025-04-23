import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server'
import { NextResponse } from 'next/server'

const isAuthRoute = createRouteMatcher(['/auth(.*)'])
const isProtectedRoute = createRouteMatcher(['/(.*)'])

const allowedOrigins = [
  process.env.NEXT_PUBLIC_URL,
  process.env.NEXT_PUBLIC_DASHBOARDS_URL,
]

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, next-action, next-router-state-tree',
}
export default convexAuthNextjsMiddleware(
  async (req, { convexAuth }) => {
    const origin = req.headers.get('origin') ?? ''
    const isAllowedOrigin = allowedOrigins.includes(origin)

    // Handle preflighted reqests
    const isPreflight = req.method === 'OPTIONS'

    if (isPreflight) {
      const preflightHeaders = {
        ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
        ...corsOptions,
      }
      return NextResponse.json({}, { headers: preflightHeaders })
    }

    const isAuthenticated = await convexAuth.isAuthenticated()

    if (isAuthRoute(req) && isAuthenticated) {
      return nextjsMiddlewareRedirect(req, '/')
    }

    if (isProtectedRoute(req) && !isAuthenticated && !isAuthRoute(req)) {
      return nextjsMiddlewareRedirect(req, '/auth/login')
    }
  }
  // {
  //   verbose: true,
  // }
)

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
