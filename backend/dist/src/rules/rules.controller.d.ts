import { RulesService } from './rules.service';
export declare class RulesController {
    private readonly svc;
    constructor(svc: RulesService);
    ping(): {
        ok: boolean;
    };
}
