import { Controller, Get } from '@nestjs/common';
import { PowerbiService } from './powerbi.service';

@Controller('api/powerbi')
export class PowerbiController {
  constructor(private service: PowerbiService) {}

  @Get('embed-config')
  async getConfig() {
    return this.service.getEmbedToken();
  }
}
