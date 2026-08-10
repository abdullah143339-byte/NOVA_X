const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isTestUser(u) {
  const email = (u.email || '').toLowerCase();
  const username = (u.username || '').toLowerCase();
  if (/@(novaai\.test|test\.com|example\.com|example\.test|test\.in|nova\.ai|nova\.test)$/.test(email)) return true;
  if (/^(test|testuser_|e2eflow_|authtester_|repprobe|probe_|insp_|xss_|xsstest|other_)/.test(username)) return true;
  return false;
}

async function deleteUsers(ids) {
  if (ids.length === 0) return { cleaned: 0, deleted: 0 };
  const tables = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'`);
  let cleaned = 0;
  for (const t of tables) {
    const table = t.name;
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
  return { cleaned, deleted: del.count };
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`TOTAL_USERS=${users.length}`);

  const toDelete = new Set();

  const testUsers = users.filter(isTestUser);
  testUsers.forEach(u => toDelete.add(u.id));
  console.log(`TEST_USERS_FOUND=${testUsers.length}`);

  const byEmail = {};
  for (const u of users) {
    const key = (u.email || '').toLowerCase();
    (byEmail[key] = byEmail[key] || []).push(u);
  }
  let dupGroups = 0;
  for (const [email, group] of Object.entries(byEmail)) {
    if (group.length <= 1) continue;
    dupGroups++;
    const kept = group.find(g => g.role === 'SUPER_ADMIN')
      || group.find(g => g.role === 'ADMIN')
      || group[0];
    const removed = group.filter(g => g.id !== kept.id);
    console.log(`DUP_EMAIL ${email} total=${group.length} keep=${kept.email}(${kept.role}) remove=${removed.map(r => `${r.email}(${r.role})`).join(',')}`);
    removed.forEach(r => toDelete.add(r.id));
  }
  console.log(`DUP_EMAIL_GROUPS=${dupGroups}`);

  if (toDelete.size === 0) {
    console.log(`REMAINING=${users.map(u => u.email).join(', ')}`);
    await prisma.$disconnect();
    return;
  }

  const { cleaned, deleted } = await deleteUsers([...toDelete]);
  console.log(`CHILD_ROWS_DELETED=${cleaned}`);
  console.log(`DELETED_USERS=${deleted}`);

  const remaining = await prisma.user.findMany({ select: { email: true, username: true, role: true } });
  console.log(`REMAINING_TOTAL=${remaining.length}`);
  remaining.forEach(u => console.log(`  KEEP ${u.email} | ${u.username} | ${u.role}`));
  await prisma.$disconnect();
}

main().catch(e => { console.error('CLEANUP_ERROR:', e.message); process.exit(1); });
