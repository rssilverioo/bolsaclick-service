import { Controller, Post } from '@nestjs/common';
import { AnhangueraService } from './anhanguera.service';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('partner/anhanguera')
@ApiExcludeController()
export class AnhangueraController {
  constructor(private readonly anhangueraService: AnhangueraService) {}

  @Post('sync-all')
  async syncAll() {
    await this.anhangueraService.syncAllOffers();
    return { success: true };
  }
}
