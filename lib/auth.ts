import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  decideCredentialAction,
  validateCredentialInput,
  type CredentialMode,
} from "./auth-policy";
import { db } from "./db";
import {
  buildRateLimitKey,
  checkRateLimit,
  RATE_LIMITS,
} from "./rate-limit";

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
        const mode: CredentialMode =
          credentials?.mode === "signup" ? "signup" : "signin";
        const input = validateCredentialInput({
          email: credentials?.email || "",
          password: credentials?.password || "",
          mode,
        });

        if (!input.valid) {
          return null;
        }

        const authRateLimit = await checkRateLimit(
          buildRateLimitKey(`auth:${mode}`, input.email),
          RATE_LIMITS.auth
        );

        if (!authRateLimit.allowed) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: input.email },
        });

        const action = decideCredentialAction({
          mode,
          userExists: Boolean(user),
          hasPasswordHash: Boolean(user?.passwordHash),
        });

        if (action === "deny") {
          return null;
        }

        if (action === "create") {
          const passwordHash = await bcrypt.hash(input.password, 12);
          const createdUser = await db.user.create({
            data: {
              email: input.email,
              passwordHash,
              name: input.email.split("@")[0] || "SaaS User",
            },
          });

          return {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email ?? input.email,
          };
        }

        if (!user?.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          input.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? input.email,
        };
      },
    }),
  ],
};
