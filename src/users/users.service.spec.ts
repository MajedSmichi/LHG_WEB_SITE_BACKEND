import { UsersService } from './users.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new UsersService(prisma);
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const user = { id: 1, email: 'test@test.com', passwordHash: 'hash', role: 'user' };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('nobody@test.com');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const user = { id: 1, email: 'new@test.com', passwordHash: 'hash', role: 'user' };
      prisma.user.create.mockResolvedValue(user);

      const result = await service.createUser('new@test.com', 'hash', 'user');
      expect(result).toEqual(user);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'new@test.com', passwordHash: 'hash', role: 'user' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: 1, email: 'a@b.com' }];
      prisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
    });
  });

  describe('deleteById', () => {
    it('should delete a user', async () => {
      const user = { id: 2, email: 'delete@test.com', passwordHash: 'hash', role: 'user' };
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.delete.mockResolvedValue(user);

      const result = await service.deleteById(2);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteById(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for protected email', async () => {
      const user = { id: 1, email: 'smichimajed@gmail.com', passwordHash: 'hash', role: 'admin' };
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(service.deleteById(1)).rejects.toThrow(ForbiddenException);
    });
  });
});
