import { IsNotEmpty, IsString, IsNumber, IsUUID } from 'class-validator';

export class UniversityAssociationDto {
  @IsUUID()
  @IsNotEmpty()
  universityId: string;

  @IsNumber()
  @IsNotEmpty()
  externalId: string;

  @IsString()
  @IsNotEmpty()
  externalName: string;
}
