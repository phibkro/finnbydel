import { PrismaClient } from "@prisma/client";

// Singleton — reused across handler invocations on bun's long-lived
// process. Lazy-init avoids touching the DB at module load.
export const prisma = new PrismaClient();
