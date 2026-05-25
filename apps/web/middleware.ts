import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnProtectedRoute = req.nextUrl.pathname.startsWith('/learn') || req.nextUrl.pathname.startsWith('/placement')
  
  if (isOnProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL('/auth', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
