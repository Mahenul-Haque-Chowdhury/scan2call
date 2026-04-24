import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { ContactFormDto } from './dto/contact-form.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Submit contact form (public, rate-limited)' })
  async submitContactForm(@Body() dto: ContactFormDto) {
    const maskedEmail = dto.email.replace(/(.{2}).*(@.*)/, '$1***$2');
    this.logger.log(`Contact form submission from ${dto.name} <${maskedEmail}>`);

    // Send notification email to admin
    await this.notificationsService.sendContactFormNotification({
      name: dto.name,
      email: dto.email,
      message: dto.message,
    });

    return {
      data: { message: 'Thank you for your message. We will get back to you soon.' },
    };
  }
}
