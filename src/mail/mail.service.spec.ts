import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let sendMailMock: jest.Mock;

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: '123' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });
    service = new MailService();
  });

  it('should send a reset password email', async () => {
    await service.sendResetPasswordEmail('user@test.com', 'token123');

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        subject: expect.stringContaining('mot de passe'),
        html: expect.stringContaining('token123'),
      }),
    );
  });
});
