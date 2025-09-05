import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.GH_ID ?? "",
      clientSecret: process.env.GH_SECRET ?? ""
    })
  ],
  secret: process.env.NEXTAUTH_SECRET
})

export const { GET, POST } = handler
