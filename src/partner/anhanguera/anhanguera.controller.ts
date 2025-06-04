import { Controller, Post, Headers } from '@nestjs/common';
import { AnhangueraService } from './anhanguera.service';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('partner/anhanguera')
@ApiExcludeController()
export class AnhangueraController {
  constructor(private readonly anhangueraService: AnhangueraService) {}

  @Post('sync-all')
  async syncAll() {
    const totalOffers = await this.anhangueraService.syncAllOffers();

    return {
      success: true,
      message: 'Sync finalizado com sucesso',
      totalOffers,
    };
  }

  @Post('flush-all')
  async flushAll() {
    await this.anhangueraService.deleteAllAnhangueraData();
    return {
      success: true,
      message: 'Dados da Anhanguera removidos do Redis.',
    };
  }
}
