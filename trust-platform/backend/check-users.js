const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ 
    where: { role: { in: ['FOUNDER', 'ADMIN', 'REVIEWER'] } }, 
    select: { email: true, role: true, name: true } 
  });
  console.log(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());