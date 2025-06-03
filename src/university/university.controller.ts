// src/university/university.controller.ts
import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
import { UniversityService } from './university.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';

@Controller('universities')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Post()
  create(@Body() dto: CreateUniversityDto) {
    return this.universityService.create(dto);
  }

  @Get()
  findAll() {
    return this.universityService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.universityService.findOne(slug);
  }

  @Put(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateUniversityDto) {
    return this.universityService.update(slug, dto);
  }
}
