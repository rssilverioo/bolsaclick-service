// src/university/university.controller.ts
import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
import { UniversityService } from './university.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Universities')
@Controller('universities')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new university' })
  @ApiBody({ type: CreateUniversityDto })
  create(@Body() dto: CreateUniversityDto) {
    return this.universityService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all universities' })
  findAll() {
    return this.universityService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get university by slug' })
  @ApiParam({ name: 'slug', type: String })
  findOne(@Param('slug') slug: string) {
    return this.universityService.findOne(slug);
  }

  @Put(':slug')
  @ApiOperation({ summary: 'Update a university by slug' })
  @ApiParam({ name: 'slug', type: String })
  @ApiBody({ type: UpdateUniversityDto })
  update(@Param('slug') slug: string, @Body() dto: UpdateUniversityDto) {
    return this.universityService.update(slug, dto);
  }
}
