import { PlaidAdapter } from './plaid/plaid.adapter';
import { FlinksAdapter } from './flinks/flinks.adapter';
export declare class ProviderRegistry {
    private plaid;
    private flinks;
    constructor(plaid: PlaidAdapter, flinks: FlinksAdapter);
    byProvider(provider: 'plaid' | 'flinks'): PlaidAdapter | FlinksAdapter;
}
