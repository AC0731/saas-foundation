import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveDatabaseUrl } from "./lib/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
