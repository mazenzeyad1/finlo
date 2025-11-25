import { FlinksAdapter } from '../providers/flinks/flinks.adapter';
export declare class WebhooksController {
    private flinks;
    constructor(flinks: FlinksAdapter);
    handle(sig: string, req: any, _body: any): {
        received: boolean;
    };
}
