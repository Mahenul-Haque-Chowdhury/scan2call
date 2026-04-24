import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ContactController } from './contact.controller';

@Module({
  controllers: [HealthController, ContactController],
})
export class HealthModule {}
