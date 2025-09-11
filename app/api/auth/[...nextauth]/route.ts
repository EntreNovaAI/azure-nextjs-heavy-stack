import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { prisma } from "@/lib/prisma"

// Configure NextAuth with v4 syntax
const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "jwt" 
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GH_ID ?? "",
      clientSecret: process.env.GH_SECRET ?? ""
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // v4 specific configuration
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      return token
    }
  }
})

// Export handlers for App Router (NextAuth v4 compatible)
export { handler as GET, handler as POST }
