import { Global, Module } from '@nestjs/common';
import { LoggingModule } from '../logging/logging.module';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
