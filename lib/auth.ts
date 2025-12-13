import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // 1. Check if the user already exists in Neon
        let user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        // 2. If not, create them so we can link Notes to them
        if (!user) {
          user = await db.user.create({
            data: {
              email: credentials.email,
              name: "SaaS User",
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
    }),
  ],
};