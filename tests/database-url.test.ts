import { describe, expect, it } from "vitest";
import {
  hasConfiguredDatabase,
  isPreviewWithoutDatabase,
  isVercelPreview,
  resolveDatabaseUrl,
} from "../lib/database-url";

describe("database URL resolution", () => {
  it("uses the configured database URL when present", () => {
    const env = {
      DATABASE_URL: "postgresql://user:pass@db.example.com:5432/app",
      VERCEL: "1",
      VERCEL_ENV: "preview",
    };

    expect(resolveDatabaseUrl(env)).toBe(env.DATABASE_URL);
    expect(hasConfiguredDatabase(env)).toBe(true);
    expect(isPreviewWithoutDatabase(env)).toBe(false);
  });

  it("allows a build-only placeholder for Vercel Preview without secrets", () => {
    const env = {
      VERCEL: "1",
      VERCEL_ENV: "preview",
    };

    expect(isVercelPreview(env)).toBe(true);
    expect(hasConfiguredDatabase(env)).toBe(false);
    expect(isPreviewWithoutDatabase(env)).toBe(true);
    expect(resolveDatabaseUrl(env)).toMatch(
      /^postgresql:\/\/preview:preview@127\.0\.0\.1:5432\/preview$/
    );
  });

  it("still requires a real database outside Vercel Preview", () => {
    expect(() =>
      resolveDatabaseUrl({
        VERCEL: "1",
        VERCEL_ENV: "production",
      })
    ).toThrow("DATABASE_URL is required outside Vercel Preview deployments.");
  });
});
