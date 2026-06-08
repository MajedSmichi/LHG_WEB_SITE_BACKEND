import { AuthService } from './auth.service';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let mailService: any;
  let prisma: any;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    };
    mailService = {
      sendResetPasswordEmail: jest.fn(),
    };
    prisma = {
      user: {
        update: jest.fn(),
      },
    };
    service = new AuthService(usersService, jwtService, mailService, prisma);
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const user = { id: 1, email: 'test@test.com', passwordHash: 'hashed', role: 'user' };
      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toEqual({ userId: 1, email: 'test@test.com', role: 'user' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser('bad@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const user = { id: 1, email: 'test@test.com', passwordHash: 'hashed', role: 'user' };
      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('test@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access_token', async () => {
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login({ userId: 1, email: 'test@test.com', role: 'user' });
      expect(result).toEqual({ access_token: 'jwt-token' });
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email', async () => {
      const user = { id: 1, email: 'test@test.com' };
      usersService.findByEmail.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('reset-token');
      mailService.sendResetPasswordEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@test.com');
      expect(result).toEqual({ message: 'Email de réinitialisation envoyé' });
      expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith('test@test.com', 'reset-token');
    });

    it('should throw NotFoundException if email not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.forgotPassword('bad@test.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, email: 'test@test.com' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHash');
      prisma.user.update.mockResolvedValue({});

      const result = await service.resetPassword('valid-token', 'newpassword');
      expect(result).toEqual({ message: 'Mot de passe réinitialisé avec succès' });
    });

    it('should throw BadRequestException for short password', async () => {
      await expect(service.resetPassword('token', '12345')).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
      await expect(service.resetPassword('bad-token', 'newpassword')).rejects.toThrow(UnauthorizedException);
    });
  });
});
