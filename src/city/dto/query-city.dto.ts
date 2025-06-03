import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;
}
