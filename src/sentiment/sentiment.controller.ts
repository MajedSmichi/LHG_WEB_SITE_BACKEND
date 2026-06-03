import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SentimentService } from './sentiment.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('api/sentiment')
export class SentimentController {
  constructor(private readonly sentimentService: SentimentService) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyze(@Body() body: { text: string }) {
    return this.sentimentService.analyze(body.text);
  }
}