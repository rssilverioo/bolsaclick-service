/* eslint-disable @typescript-eslint/no-unsafe-argument */
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

  // 🔹 novos campos
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  jobMarket?: string;
}