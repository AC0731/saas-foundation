const PREVIEW_DATABASE_URL =
  "postgresql://preview:preview@127.0.0.1:5432/preview";

type Environment = Record<string, string | undefined>;

export function isVercelPreview(env: Environment = process.env) {
  return env.VERCEL === "1" && env.VERCEL_ENV === "preview";
}

export function hasConfiguredDatabase(env: Environment = process.env) {
  return Boolean(env.DATABASE_URL?.trim());
}

export function resolveDatabaseUrl(env: Environment = process.env) {
  const configured = env.DATABASE_URL?.trim();

  if (configured) {
    return configured;
  }

  if (isVercelPreview(env)) {
    return PREVIEW_DATABASE_URL;
  }

  throw new Error(
    "DATABASE_URL is required outside Vercel Preview deployments."
  );
}

export function isPreviewWithoutDatabase(env: Environment = process.env) {
  return isVercelPreview(env) && !hasConfiguredDatabase(env);
}
