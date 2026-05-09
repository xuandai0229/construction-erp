import { PrismaClient } from "../generated/prisma-client";

// Models that support soft-delete via deletedAt
const SOFT_DELETE_MODELS = new Set(['user', 'category', 'project', 'task', 'invoice', 'payment', 'costrecord', 'wbsitem', 'revenue']);

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            model &&
            SOFT_DELETE_MODELS.has(model.toLowerCase()) &&
            (
              operation === 'findUnique' ||
              operation === 'findFirst' ||
              operation === 'findMany' ||
              operation === 'count'
            )
          ) {
            // Automatically exclude soft-deleted records
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
