import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { UnoparService } from './unopar.service';

@Controller('partner/unopar')
@ApiExcludeController()
export class UnoparController {
  constructor(private readonly unoparService: UnoparService) {}

  @Post('flush-all')
  async flushAll(@Headers('x-api-key') apiKey: string) {
    if (apiKey !== process.env.CRON_API_KEY) {
      throw new UnauthorizedException('Invalid API Key');
    }

    await this.unoparService.deleteAllUnoparData();

    return {
      success: true,
      message: 'Dados da Unopar removidos do Redis.',
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

    return this.unoparService.getOffersByCourse(course, city, state, modality);
  }
}
