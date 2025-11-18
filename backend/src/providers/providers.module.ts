import { Module } from '@nestjs/common';
import { FlinksAdapter } from './flinks/flinks.adapter';

@Module({
  providers: [FlinksAdapter],
  exports: [FlinksAdapter],
})
export class ProvidersModule {}
