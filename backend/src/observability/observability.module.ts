import { Module } from '@nestjs/common';
import { LoggerInterceptor } from './logger.interceptor';

@Module({
  providers: [LoggerInterceptor],
  exports: [LoggerInterceptor],
})
export class ObservabilityModule {}
