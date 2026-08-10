const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isTestUser(u) {
  const email = (u.email || '').toLowerCase();
  const username = (u.username || '').toLowerCase();
  if (/@(novaai\.test|test\.com|example\.com|example\.test|test\.in|nova\.ai|nova\.test)$/.test(email)) return true;
  if (/^(test|testuser_|e2eflow_|authtester_|repprobe|probe_|insp_|xss_|xsstest|other_)/.test(username)) return true;
  return false;
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, username: true } });
  const targets = users.filter(isTestUser);
  console.log(`TOTAL_USERS=${users.length}`);
  console.log(`TEST_USERS_FOUND=${targets.length}`);
  if (targets.length === 0) {
    console.log(`REMAINING=${users.map(u => u.email).join(', ')}`);
    await prisma.$disconnect();
    return;
  }
  const ids = targets.map(t => t.id);

  const tables = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'`);
  const tableNames = tables.map(t => t.name);

  let cleaned = 0;
  for (const table of tableNames) {
    if (table === 'users') continue;
    const fks = await prisma.$queryRawUnsafe(`PRAGMA foreign_key_list("${table}")`);
    const userCols = fks.filter(f => f.table === 'users').map(f => f.from);
    if (userCols.length === 0) continue;
    for (const col of userCols) {
      const ph = ids.map(() => '?').join(',');
      const count = await prisma.$executeRawUnsafe(
        `DELETE FROM "${table}" WHERE "${col}" IN (${ph})`, ...ids
      );
      if (count > 0) { cleaned += count; console.log(`  CLEANED ${table}.${col}: ${count}`); }
    }
  }

  const del = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`CHILD_ROWS_DELETED=${cleaned}`);
  console.log(`DELETED_USERS=${del.count}`);

  const remaining = await prisma.user.findMany({ select: { email: true, username: true } });
  console.log(`REMAINING_TOTAL=${remaining.length}`);
  remaining.forEach(u => console.log(`  KEEP ${u.email} | ${u.username}`));
  await prisma.$disconnect();
}

main().catch(e => { console.error('CLEANUP_ERROR:', e.message); process.exit(1); });
