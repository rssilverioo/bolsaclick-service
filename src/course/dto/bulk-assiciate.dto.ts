import { IsString } from 'class-validator';

export class BulkAssociateFromUniversitySlugDto {
  @IsString()
  course: string; // Nome completo vindo da Anhanguera (ex: "Administração - Bacharelado")

  @IsString()
  courseId: string; // Esse é o externalId
}
