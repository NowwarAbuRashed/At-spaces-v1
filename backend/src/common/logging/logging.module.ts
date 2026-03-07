import { Global, Module } from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  providers: [RequestContextService, AppLogger],
  exports: [RequestContextService, AppLogger],
})
export class LoggingModule {}

