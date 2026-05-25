import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

export default {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    session({ session, user, token }) {
      if (session.user && user) {
        session.user.id = user.id
      } else if (session.user && token) {
        session.user.id = token.sub as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
