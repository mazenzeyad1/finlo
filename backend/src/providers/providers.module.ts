import { Module } from '@nestjs/common';
import { PlaidAdapter } from './plaid/plaid.adapter';
import { FlinksAdapter } from './flinks/flinks.adapter';
import { ProviderRegistry } from './registry';

@Module({
  providers: [PlaidAdapter, FlinksAdapter, ProviderRegistry],
  exports: [ProviderRegistry, PlaidAdapter, FlinksAdapter],
})
export class ProvidersModule {}
