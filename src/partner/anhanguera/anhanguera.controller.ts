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
  syncAll(@Headers('x-api-key') apiKey: string): {
    success: boolean;
    message: string;
  } {
    if (apiKey !== process.env.CRON_API_KEY) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // ✅ Executa em background (não trava o n8n nem precisa de await)
    void this.anhangueraService.syncAllOffers();

    return {
      success: true,
      message: 'Sincronização iniciada em segundo plano.',
    };
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
