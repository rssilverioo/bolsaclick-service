/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/course/dto/create-course.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UniversityAssociationDto } from './university-association.dto';
import { CourseModality } from '@prisma/client';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UniversityAssociationDto)
  universityAssociations?: UniversityAssociationDto[];

  @IsEnum(CourseModality)
  modality: CourseModality;
}
