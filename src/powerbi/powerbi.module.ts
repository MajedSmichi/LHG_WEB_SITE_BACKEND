import { Module } from '@nestjs/common';
import { PowerbiService } from './powerbi.service';
import { PowerbiController } from './powerbi.controller';

@Module({
  controllers: [PowerbiController],
  providers: [PowerbiService],
})
export class PowerbiModule {}
