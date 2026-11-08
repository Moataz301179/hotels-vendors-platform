const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const profiles = await prisma.directoryProfile.findMany({
    select: { id: true, category: true, name: true, publicationStatus: true },
    take: 20
  });
  console.log('Total Directory Profiles:', profiles.length);
  if (profiles.length > 0) {
    console.log('Sample categories:', profiles.map(p => p.category).filter((v, i, a) => a.indexOf(v) === i));
  }
  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
