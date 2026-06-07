import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { MailModule } from './mail/mail.module.js';
import { PrismaModule } from './prisma.module.js';
import { SentimentModule } from './sentiment/sentiment.module.js';
import { ChatbotModule } from './chatbot/chatbot.module.js';
import { ConversationsModule } from './conversations/conversations.module.js';
import { PowerbiModule } from './powerbi/powerbi.module';

@Module({
  imports: [AuthModule, MailModule, PrismaModule, ChatbotModule, ConversationsModule, SentimentModule,PowerbiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
