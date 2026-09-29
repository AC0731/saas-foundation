import { spawnSync } from "node:child_process";

const isVercelProduction =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production";

if (!isVercelProduction) {
  console.log(
    "Production schema bridge skipped: this is not a Vercel production build."
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "Production schema bridge refused to run: DATABASE_URL is missing."
  );
  process.exit(1);
}

console.log(
  "Running one-time Prisma schema bridge for the legacy db-push production database."
);
console.log(
  "Safety policy: prisma db push is running WITHOUT --accept-data-loss; destructive drift must fail the deployment."
);

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "db", "push", "--skip-generate"],
  {
    stdio: "inherit",
    env: process.env,
  }
);

if (result.error) {
  console.error("Production schema bridge could not start:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    "Production schema bridge failed. The application build will stop and the previous production deployment will remain active."
  );
  process.exit(result.status ?? 1);
}

console.log("Production schema bridge completed successfully.");
