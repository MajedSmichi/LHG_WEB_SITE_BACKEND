import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service.js';
import { ChatbotController } from './chatbot.controller.js';
import { PrismaModule } from '../prisma.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';

@Module({
  imports: [PrismaModule, ConversationsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}