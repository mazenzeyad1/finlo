import { Injectable } from '@nestjs/common';
import { PlaidAdapter } from './plaid/plaid.adapter';
import { FlinksAdapter } from './flinks/flinks.adapter';

@Injectable()
export class ProviderRegistry {
  constructor(private plaid: PlaidAdapter, private flinks: FlinksAdapter) {}

  byProvider(provider: 'plaid' | 'flinks') {
    return provider === 'plaid' ? this.plaid : this.flinks;
  }
}
