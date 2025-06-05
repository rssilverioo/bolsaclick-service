import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AnhangueraService } from './anhanguera.service';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('partner/anhanguera')
@ApiExcludeController()
export class AnhangueraController {
  constructor(private readonly anhangueraService: AnhangueraService) {}

  @Post('flush-all')
  async flushAll(@Headers('x-api-key') apiKey: string) {
    if (apiKey !== process.env.CRON_API_KEY) {
      throw new UnauthorizedException('Invalid API Key');
    }

    await this.anhangueraService.deleteAllAnhangueraData();

    return {
      success: true,
      message: 'Dados da Anhanguera removidos do Redis.',
    };
  }

  @Get('offers')
  async getOffersByCourse(
    @Query('course') course: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('modality') modality?: string,
  ) {
    if (!course) {
      throw new BadRequestException('O parâmetro "course" é obrigatório');
    }

    return this.anhangueraService.getOffersByCourse(
      course,
      city,
      state,
      modality,
    );
  }
}
