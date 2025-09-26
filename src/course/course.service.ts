import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UniversityAssociationDto } from './dto/university-association.dto';
import slugify from 'slugify';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BulkAssociateFromUniversitySlugDto } from './dto/bulk-assiciate.dto';

type UniversityCourseInput = {
  courseId: string;
  universityId: string;
  externalId: string;
  externalName: string;
};

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createCourseDto: CreateCourseDto) {
    const { name, slug, description, targetAudience, jobMarket, universityAssociations } = createCourseDto;

    const generatedSlug = slug ?? slugify(name, { lower: true, strict: true });

    const existing = await this.prisma.course.findUnique({
      where: { slug: generatedSlug },
    });

    if (existing) {
      return existing;
    }

    const course = await this.prisma.course.create({
      data: {
        name,
        slug: generatedSlug,
        description,
        targetAudience,
        jobMarket,
      },
    });

    if (universityAssociations && universityAssociations.length > 0) {
      const associationsData: UniversityCourseInput[] =
        universityAssociations.map((assoc: UniversityAssociationDto) => ({
          courseId: course.id,
          universityId: assoc.universityId,
          externalId: assoc.externalId,
          externalName: assoc.externalName,
        }));

      await this.prisma.universityCourse.createMany({
        data: associationsData,
        skipDuplicates: true,
      });

      return {
        course,
        associations: associationsData,
      };
    }

    return course;
  }

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        universityCourses: {
          include: {
            university: true,
          },
        },
      },
    });
  }
  async findBySlug(slug: string) {
    return this.prisma.course.findUnique({
      where: { slug },
      include: {
        universityCourses: {
          include: {
            university: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        universityCourses: {
          include: {
            university: true,
          },
        },
      },
    });
  }

  async update(slug: string, dto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { slug },
      data: {
        name: dto.name,
        slug:
          dto.slug ?? slugify(dto.name ?? '', { lower: true, strict: true }),
      },
    });
  }

  async bulkAssociateFromUniversitySlug(
    universitySlug: string,
    items: BulkAssociateFromUniversitySlugDto[],
  ) {
    const results: { course: string; status: string }[] = [];

    const university = await this.prisma.university.findUnique({
      where: { slug: universitySlug },
    });

    if (!university) {
      throw new Error('University not found');
    }

    for (const item of items) {
      const generatedSlug = slugify(
        item.course.replace(/ - (Bacharelado|Tecnólogo|Licenciatura)/i, ''),
        {
          lower: true,
          strict: true,
        },
      );

      const course =
        (await this.prisma.course.findUnique({
          where: { slug: generatedSlug },
        })) ??
        (await this.prisma.course.create({
          data: {
            name: item.course,
            slug: generatedSlug,
          },
        }));

      const alreadyExists = await this.prisma.universityCourse.findUnique({
        where: {
          courseId_universityId: {
            courseId: course.id,
            universityId: university.id,
          },
        },
      });

      if (alreadyExists) {
        results.push({ course: item.course, status: 'Already associated' });
        continue;
      }

      await this.prisma.universityCourse.create({
        data: {
          courseId: course.id,
          universityId: university.id,
          externalId: item.courseId,
          externalName: item.course,
        },
      });

      results.push({ course: item.course, status: 'Associated' });
    }

    return results;
  }
}
