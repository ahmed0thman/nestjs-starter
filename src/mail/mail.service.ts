import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { env } from 'src/common/config/env/env';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';
import { render } from '@react-email/render';
import { WelcomeEmail } from './templates/WelcomeEmail';

export interface emailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private readonly appLogger: AppLoggerService) {
    const smtpConfig: SMTPTransport.Options = {
      host: env.NODE_MAILER_HOST,
      port: parseInt(env.NODE_MAILER_PORT, 10),
      auth: {
        user: env.NODE_MAILER_USER,
        pass: env.NODE_MAILER_PASS,
      },
    };
    this.transporter = createTransport(smtpConfig);
  }

  private async sendMail(options: emailOptions): Promise<void> {
    const mailOptions = {
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const subject = 'Welcome to <APP_NAME>!';
    const html = await render(
      WelcomeEmail({
        name,
        appName: '<APP_NAME>',
        loginUrl: 'https://example.com/login',
        supportEmail: 'support@example.com',
      }),
    );
    await this.sendMail({ to, subject, html });
  }

  async testConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.appLogger.log('SMTP connection successful', 'MailService');
    } catch (error) {
      this.appLogger.error(
        'SMTP connection failed',
        error as string,
        'MailService',
      );
    }
  }
}
