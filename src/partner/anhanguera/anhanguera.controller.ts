import {
  Controller,
  Post,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { AnhangueraService } from './anhanguera.service';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('partner/anhanguera')
@ApiExcludeController()
export class AnhangueraController {
  constructor(private readonly anhangueraService: AnhangueraService) {}

  @Post('sync-all')
  async syncAll(@Headers('x-api-key') apiKey: string) {
    if (apiKey !== process.env.CRON_API_KEY) {
      throw new UnauthorizedException('Invalid API Key');
    }

    await this.anhangueraService.syncAllOffers();
    return { success: true, message: 'Sync completed via GitHub Actions' };
  }
}
