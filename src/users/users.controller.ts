import { Controller, Delete, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('all')
  async findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.deleteById(parseInt(id, 10));
  }
}
