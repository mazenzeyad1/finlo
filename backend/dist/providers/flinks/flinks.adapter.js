"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlinksAdapter = void 0;
const common_1 = require("@nestjs/common");
let FlinksAdapter = class FlinksAdapter {
    async getLinkToken(userId) { return { linkToken: `mock-flinks-link-${userId}` }; }
    async exchangePublicToken(publicToken) {
        return { accessToken: `mock-flinks-access-${publicToken}`, institution: { id: 'flinks:mock', name: 'Mock Bank (Flinks)' } };
    }
    async fetchAccounts(accessToken) {
        return [{ externalId: 'flinks-acc-1', name: 'Savings', type: 'savings', currency: 'CAD', balance: 5000 }];
    }
    async fetchTransactions(accessToken, opts) {
        return { transactions: [], nextCursor: opts.cursor || 'cursor-1' };
    }
    verifyWebhook(sigHeader, rawBody) { return true; }
};
exports.FlinksAdapter = FlinksAdapter;
exports.FlinksAdapter = FlinksAdapter = __decorate([
    (0, common_1.Injectable)()
], FlinksAdapter);
//# sourceMappingURL=flinks.adapter.js.map