import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Controller('api/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Post()
  create(@Request() req, @Body('title') title?: string) {
    return this.conversationsService.create(req.user.id, title);
  }

  @Get()
  findAll(@Request() req, @Query('skip') skip = 0, @Query('take') take = 20) {
    return this.conversationsService.findAllByUser(
      req.user.id,
      Number(skip),
      Number(take),
    );
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.conversationsService.findOne(Number(id), req.user.id);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(Number(id), req.user.id, dto);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.conversationsService.delete(Number(id), req.user.id);
  }

  @Post(':id/toggle-pin')
  togglePin(@Request() req, @Param('id') id: string) {
    return this.conversationsService.togglePin(Number(id), req.user.id);
  }
}
