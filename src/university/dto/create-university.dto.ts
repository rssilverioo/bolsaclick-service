// src/university/dto/create-university.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUniversityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
