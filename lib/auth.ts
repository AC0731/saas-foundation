import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/api/auth/signin",
  },
  callbacks: {
    // This forces the user to the dashboard after a successful login
    async redirect({ url, baseUrl }) {
      return baseUrl + "/dashboard";
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        return {
          id: "1",
          name: "SaaS User",
          email: credentials.email,
        };
      }
    }),
  ],
};