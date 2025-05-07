import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'
import { NextResponse } from 'next/server'

// export default convexAuthNextjsMiddleware(async (req, { convexAuth }) => {
//   const tokenCookie = req.cookies.get('__convexAuthJWT')
//   const refreshTokenCookie = req.cookies.get('__convexAuthRefreshToken')

//   const url = req.nextUrl.clone()
//   const token = url.searchParams.get('token')
//   const refreshToken = url.searchParams.get('refresh')
//   const justSetCookies = url.searchParams.get('justSetCookies') === 'true'

//   // Clean the URL
//   url.searchParams.delete('token')
//   url.searchParams.delete('refresh')
//   url.searchParams.delete('justSetCookies')

//   if (token && refreshToken && (!tokenCookie || !refreshTokenCookie)) {
//     const response = NextResponse.redirect(
//       `${url.toString()}?justSetCookies=true`
//     )
//     response.cookies.set({
//       name: '__convexAuthJWT',
//       value: token,
//       httpOnly: true,
//       sameSite: 'lax',
//       path: '/',
//     })
//     response.cookies.set({
//       name: '__convexAuthRefreshToken',
//       value: refreshToken,
//       httpOnly: true,
//       sameSite: 'lax',
//       path: '/',
//     })
//     return response
//   }

//   if (justSetCookies) {
//     // Skip auth check on immediate redirect after setting cookies
//     return NextResponse.next()
//   }

//   const isAuthenticated = await convexAuth.isAuthenticated()
//   if (!isAuthenticated) {
//     return NextResponse.redirect(new URL('/auth/login', req.url))
//   }

//   return NextResponse.next()
// })

export default convexAuthNextjsMiddleware(async (req, { convexAuth }) => {
  const { pathname, searchParams } = req.nextUrl
  const tokenCookie = req.cookies.get('__convexAuthJWT')
  const refreshTokenCookie = req.cookies.get('__convexAuthRefreshToken')
  const token = searchParams.get('token')
  const refreshToken = searchParams.get('refresh')

  // If tokens exist and cookies aren't already set, set them
  if (token && refreshToken) {
    const response = NextResponse.next()
    response.cookies.set({
      name: '__convexAuthJWT',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
    response.cookies.set({
      name: '__convexAuthRefreshToken',
      value: refreshToken,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
    return response
  }
  // ts is so hacky :sob:
  const isAuthenticated = await convexAuth.isAuthenticated()
  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL(`/login?redirect=${req.url}`, req.url))
  }
})

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
