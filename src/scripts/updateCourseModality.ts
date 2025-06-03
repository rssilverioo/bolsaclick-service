/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PrismaClient, CourseModality } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.course.updateMany({
    data: {
      modality: CourseModality.GRADUACAO,
    },
  });

  console.log(`✅ Cursos atualizados: ${updated.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
