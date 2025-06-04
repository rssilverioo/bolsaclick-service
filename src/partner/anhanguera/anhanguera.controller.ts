import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AnhangueraService } from './anhanguera.service';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('partner/anhanguera')
@ApiExcludeController()
export class AnhangueraController {
  constructor(private readonly anhangueraService: AnhangueraService) {}

  @Post('sync-all')
  syncAll(@Headers('x-api-key') apiKey: string) {
    if (apiKey !== process.env.CRON_API_KEY) {
      throw new UnauthorizedException('Invalid API Key');
    }

    this.anhangueraService
      .syncAllOffers()
      .then(() => console.log('✅ Sync completed'))
      .catch((err) => console.error('❌ Error during sync', err));

    return { success: true, message: 'Sync started in background' };
  }

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
}
