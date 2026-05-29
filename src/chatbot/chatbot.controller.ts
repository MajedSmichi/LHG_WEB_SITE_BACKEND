import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ChatbotService } from './chatbot.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('api/chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  async askQuestion(
    @Request() req,
    @Body() body: { question: string; conversationId?: number },
  ) {
    console.log('🔐 User:', req.user);
    console.log('📝 Question:', body.question);
    return await this.chatbotService.askQuestion(
      body.question,
      req.user.userId,
      body.conversationId,
    );
  }
}