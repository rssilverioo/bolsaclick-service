// src/university/university.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import slugify from 'slugify';
import { UpdateUniversityDto } from './dto/update-university.dto';

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUniversityDto) {
    const generatedSlug =
      dto.slug ?? slugify(dto.name, { lower: true, strict: true });

    const existing = await this.prisma.university.findUnique({
      where: { slug: generatedSlug },
    });

    if (existing) return existing;

    return this.prisma.university.create({
      data: {
        name: dto.name,
        slug: generatedSlug,
        description: dto.description,
      },
    });
  }

  async findAll() {
    return this.prisma.university.findMany();
  }

  async findOne(slug: string) {
    return this.prisma.university.findUnique({
      where: { slug },
    });
  }

  async update(slug: string, dto: UpdateUniversityDto) {
    return this.prisma.university.update({
      where: { slug },
      data: {
        name: dto.name,
        slug:
          dto.slug ?? slugify(dto.name ?? '', { lower: true, strict: true }),
        description: dto.description,
      },
    });
  }
}
