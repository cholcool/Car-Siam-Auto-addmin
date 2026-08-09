import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('PrismaClient is required a connection string. Please set the DATABASE_URL environment variable.')
}

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })

type PrismaClientWithAdapter = ReturnType<typeof createPrismaClient>

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientWithAdapter | undefined
}

const prisma = global.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
