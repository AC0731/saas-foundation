import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    // Prisma client (Next already auto-externalizes this in many cases)
    "@prisma/client",

    // ALSO externalize your adapter + DB driver (pick the ones you use)
    // Postgres:
    "@prisma/adapter-pg",
    "pg",

    // MySQL/MariaDB (use these instead of pg ones):
    // "@prisma/adapter-mariadb",
    // "mariadb",

    // SQLite (use these instead of pg ones):
    // "@prisma/adapter-better-sqlite3",
    // "better-sqlite3",
  ],
};

export default nextConfig;
