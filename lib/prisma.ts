// Select Prisma client implementation at runtime so the same codebase
// can support Node serverless and the Prisma edge client.
// Set PRISMA_EDGE=true to use the edge client (import from '@prisma/client/edge').

declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var __prisma: any | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma: any = (() => {
    if (process.env.PRISMA_EDGE === 'true') {
        // Use Prisma edge client (V8 isolate compatible). No global caching.
        // Use require to avoid bundlers trying to statically include both clients.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PrismaClient } = require('@prisma/client/edge');
        return new PrismaClient();
    }

    // Use standard Prisma client. Preserve the previous global dev caching behavior
    // to avoid multiple clients during hot reload in development.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');

    if (process.env.NODE_ENV === 'development') {
        global.__prisma = global.__prisma || new PrismaClient();
        return global.__prisma;
    }

    return new PrismaClient();
})();

export { prisma };
