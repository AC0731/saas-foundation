import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
        mode: {
          label: "Mode",
          type: "text",
        },
      },
      async authorize(credentials) {
        const email = credentials?.email
          ? normalizeEmail(credentials.email)
          : "";

        const password = credentials?.password?.trim() || "";
        const mode = credentials?.mode === "signup" ? "signup" : "signin";

        if (!email || !password) {
          return null;
        }

        let user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          if (mode !== "signup") {
            return null;
          }

          const passwordHash = await bcrypt.hash(password, 12);

          user = await db.user.create({
            data: {
              email,
              passwordHash,
              name: email.split("@")[0] || "SaaS User",
            },
          });
        } else {
          if (mode === "signup") {
            return null;
          }

          if (!user.passwordHash) {
            const passwordHash = await bcrypt.hash(password, 12);

            user = await db.user.update({
              where: { id: user.id },
              data: { passwordHash },
            });
          } else {
            const isPasswordValid = await bcrypt.compare(
              password,
              user.passwordHash
            );

            if (!isPasswordValid) {
              return null;
            }
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? email,
        };
      },
    }),
  ],
};
