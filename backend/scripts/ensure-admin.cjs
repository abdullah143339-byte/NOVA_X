const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.ADMIN_EMAIL || 'abdullah143339@gmail.com';

async function main() {
  const user = await prisma.user.findFirst({ where: { email: OWNER_EMAIL } });
  if (!user) {
    console.log(`ENSURE_ADMIN no_user email=${OWNER_EMAIL}`);
    await prisma.$disconnect();
    return;
  }
  if (user.role !== 'SUPER_ADMIN') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'SUPER_ADMIN' } });
    console.log(`ENSURE_ADMIN upgraded id=${user.id} email=${user.email} role=${user.role} -> SUPER_ADMIN`);
  } else {
    console.log(`ENSURE_ADMIN already_admin id=${user.id} email=${user.email}`);
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error('ENSURE_ADMIN_ERROR:', e.message); process.exit(1); });
