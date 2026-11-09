import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Migrations need a direct connection; poolers (Neon's included) don't
    // support the session features Prisma Migrate relies on. The app itself
    // uses the pooled DATABASE_URL at runtime.
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
});
