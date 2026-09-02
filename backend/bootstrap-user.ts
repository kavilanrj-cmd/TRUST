import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ where: { role: { in: ['FOUNDER', 'ADMIN', 'REVIEWER'] } }, select: { email: true, role: true, name: true } });
  console.log('Staff users:', users);
  
  // Create founder if none exist
  const staffCount = await prisma.user.count({ where: { role: { in: ['FOUNDER', 'ADMIN', 'REVIEWER'] } } });
  console.log('Staff count:', staffCount);
  
  if (staffCount === 0) {
    const email = process.env.FOUNDER_EMAIL;
    const password = process.env.FOUNDER_PASSWORD;
    if (email && password) {
      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          name: 'Founder',
          email,
          password: hashed,
          role: 'FOUNDER',
          emailVerified: true,
          isFounderProtected: true,
        },
      });
      console.log('✅ Bootstrap founder account created');
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());