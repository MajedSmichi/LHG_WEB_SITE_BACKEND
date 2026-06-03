import { Module } from '@nestjs/common';
import { SentimentController } from './sentiment.controller.js';
import { SentimentService } from './sentiment.service.js';

@Module({
  controllers: [SentimentController],
  providers: [SentimentService],
  exports: [SentimentService],
})
export class SentimentModule {}