const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OWNER_EMAIL = (process.env.ADMIN_EMAIL || 'abdullah143339@gmail.com').toLowerCase();

const DEMO = {
  subjects: ['sub-ai', 'sub-prog', 'sub-math', 'sub-sec'],
  notes: ['note-1', 'note-2', 'note-3'],
  lectures: ['lec-1', 'lec-2', 'lec-3'],
  files: ['file-1', 'file-2'],
  tasks: ['task-1', 'task-2', 'task-3'],
  bookmarks: ['bm-1', 'bm-2', 'bm-3'],
};

async function main() {
  const user = await prisma.user.findFirst({ where: { email: OWNER_EMAIL } });
  if (!user) {
    console.log(`OWNER_NOT_FOUND email=${OWNER_EMAIL}`);
    await prisma.$disconnect();
    return;
  }
  console.log(`OWNER id=${user.id} email=${user.email} username=${user.username}`);

  const where = { userId: user.id };

  // Only wipe the fake study sessions while the demo seed is still present.
  // Once demo rows are gone the script becomes a safe no-op, so real study
  // sessions are never touched on later deployments.
  const demoPresent = await prisma.learningSubject.count({
    where: { ...where, id: { in: DEMO.subjects } },
  });

  const bookmarks = await prisma.learningBookmark.deleteMany({ where: { ...where, id: { in: DEMO.bookmarks } } });
  console.log(`BOOKMARKS_DELETED=${bookmarks.count}`);

  const tasks = await prisma.learningTask.deleteMany({ where: { ...where, id: { in: DEMO.tasks } } });
  console.log(`TASKS_DELETED=${tasks.count}`);

  const files = await prisma.learningFile.deleteMany({ where: { ...where, id: { in: DEMO.files } } });
  console.log(`FILES_DELETED=${files.count}`);

  const lectures = await prisma.learningLecture.deleteMany({ where: { ...where, id: { in: DEMO.lectures } } });
  console.log(`LECTURES_DELETED=${lectures.count}`);

  const notes = await prisma.learningNote.deleteMany({ where: { ...where, id: { in: DEMO.notes } } });
  console.log(`NOTES_DELETED=${notes.count}`);

  const subjects = await prisma.learningSubject.deleteMany({ where: { ...where, id: { in: DEMO.subjects } } });
  console.log(`SUBJECTS_DELETED=${subjects.count}`);

  if (demoPresent > 0) {
    const sessions = await prisma.studySession.deleteMany({ where });
    console.log(`SESSIONS_DELETED=${sessions.count} (demo seed present)`);
  } else {
    console.log(`SESSIONS_DELETED=0 (skipped, demo already cleaned)`);
  }

  const remaining = {
    subjects: await prisma.learningSubject.count({ where }),
    notes: await prisma.learningNote.count({ where }),
    lectures: await prisma.learningLecture.count({ where }),
    files: await prisma.learningFile.count({ where }),
    tasks: await prisma.learningTask.count({ where }),
    bookmarks: await prisma.learningBookmark.count({ where }),
    sessions: await prisma.studySession.count({ where }),
  };
  console.log(`REMAINING ${JSON.stringify(remaining)}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
