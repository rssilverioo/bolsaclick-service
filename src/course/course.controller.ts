// src/course/course.controller.ts
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BulkAssociateFromUniversitySlugDto } from './dto/bulk-assiciate.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  findAll() {
    return this.courseService.findAll();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.courseService.findBySlug(slug);
  }

  @Put(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.update(slug, dto);
  }

  @Post('bulk-associate/:universitySlug')
  async bulkAssociateFromUniversitySlug(
    @Param('universitySlug') universitySlug: string,
    @Body() data: BulkAssociateFromUniversitySlugDto[],
  ) {
    return this.courseService.bulkAssociateFromUniversitySlug(
      universitySlug,
      data,
    );
  }
}
