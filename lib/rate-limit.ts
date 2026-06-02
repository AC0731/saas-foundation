import "server-only";
import { db } from "./db";

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

export const RATE_LIMITS = {
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
  createNote: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  deleteNote: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  checkout: {
    maxRequests: 3,
    windowMs: 60 * 1000,
  },
  billingPortal: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
} satisfies Record<string, RateLimitConfig>;

export function buildRateLimitKey(scope: string, identifier: string) {
  const cleanScope = scope.trim().toLowerCase();
  const cleanIdentifier = identifier.trim().toLowerCase();

  return `${cleanScope}:${cleanIdentifier}`.slice(0, 180);
}

export function formatRateLimitMessage(
  action: string,
  retryAfterSeconds: number
) {
  const unit = retryAfterSeconds === 1 ? "second" : "seconds";

  return `Too many ${action} attempts. Try again in ${retryAfterSeconds} ${unit}.`;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const newResetAt = new Date(now.getTime() + config.windowMs);

  const existingLimit = await db.rateLimit.findUnique({
    where: {
      key,
    },
  });

  if (!existingLimit || existingLimit.resetAt <= now) {
    const resetLimit = await db.rateLimit.upsert({
      where: {
        key,
      },
      update: {
        count: 1,
        resetAt: newResetAt,
      },
      create: {
        key,
        count: 1,
        resetAt: newResetAt,
      },
      select: {
        count: true,
        resetAt: true,
      },
    });

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - resetLimit.count),
      resetAt: resetLimit.resetAt,
      retryAfterSeconds: Math.ceil(
        (resetLimit.resetAt.getTime() - now.getTime()) / 1000
      ),
    };
  }

  if (existingLimit.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existingLimit.resetAt,
      retryAfterSeconds: Math.ceil(
        (existingLimit.resetAt.getTime() - now.getTime()) / 1000
      ),
    };
  }

  const updatedLimit = await db.rateLimit.update({
    where: {
      key,
    },
    data: {
      count: {
        increment: 1,
      },
    },
    select: {
      count: true,
      resetAt: true,
    },
  });

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - updatedLimit.count),
    resetAt: updatedLimit.resetAt,
    retryAfterSeconds: Math.ceil(
      (updatedLimit.resetAt.getTime() - now.getTime()) / 1000
    ),
  };
}
