const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const count = await prisma.directoryProfile.count();
    console.log('DirectoryProfile count:', count);
    const sample = await prisma.directoryProfile.findMany({ select: { id: true, itemType: true, name: true, category: true, subcategory: true, images: true, publicationStatus: true }, take: 10 });
    console.log('Sample:', JSON.stringify(sample, null, 2));
  } catch (e) { console.error(e); }
  finally { await prisma.$disconnect(); }
})();
