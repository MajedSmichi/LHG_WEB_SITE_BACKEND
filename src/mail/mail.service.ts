import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://lhgstream.duckdns.org';
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    await this.transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@lhg.com',
      to: email,
      subject: 'Réinitialiser votre mot de passe - LHG',
      html: `
        <h2>Réinitialisation du mot de passe</h2>
        <p>Vous avez demandé une réinitialisation de mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe:</p>
        <a href="${resetLink}" style="background-color: #164c62; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Réinitialiser le mot de passe
        </a>
        <p>Ce lien expire dans 15 minutes.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      `
    });
  }
}
