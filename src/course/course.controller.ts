// src/course/course.controller.ts
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BulkAssociateFromUniversitySlugDto } from './dto/bulk-assiciate.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all courses' })
  findAll() {
    return this.courseService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get course by slug' })
  @ApiParam({ name: 'slug', type: String })
  findBySlug(@Param('slug') slug: string) {
    return this.courseService.findBySlug(slug);
  }

  @Put(':slug')
  @ApiOperation({ summary: 'Update a course by slug' })
  @ApiParam({ name: 'slug', type: String })
  @ApiBody({ type: UpdateCourseDto })
  update(@Param('slug') slug: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.update(slug, dto);
  }

  @Post('bulk-associate/:universitySlug')
  @ApiOperation({ summary: 'Bulk associate courses with a university' })
  @ApiParam({ name: 'universitySlug', type: String })
  @ApiBody({ type: [BulkAssociateFromUniversitySlugDto] })
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
