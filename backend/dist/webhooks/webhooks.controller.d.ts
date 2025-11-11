import { ProviderRegistry } from '../providers/registry';
export declare class WebhooksController {
    private providers;
    constructor(providers: ProviderRegistry);
    handle(name: 'plaid' | 'flinks', sig: string, req: any, body: any): {
        received: boolean;
    };
}
