"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaidAdapter = void 0;
const common_1 = require("@nestjs/common");
let PlaidAdapter = class PlaidAdapter {
    async getLinkToken(userId) {
        return { linkToken: `mock-link-token-for-${userId}` };
    }
    async exchangePublicToken(publicToken) {
        return { accessToken: `mock-access-${publicToken}`, institution: { id: 'plaid:mock', name: 'Mock Bank (Plaid)' } };
    }
    async fetchAccounts(accessToken) {
        return [{ externalId: 'ext-acc-1', name: 'Checking', type: 'checking', currency: 'CAD', balance: 1200.50 }];
    }
    async fetchTransactions(accessToken, opts) {
        return {
            transactions: [
                { externalId: 'ext-tx-1', accountExternalId: 'ext-acc-1', date: new Date().toISOString(), description: 'Coffee', amount: -4.25, currency: 'CAD', pending: false }
            ],
            nextCursor: opts.cursor || 'cursor-1'
        };
    }
    verifyWebhook(sigHeader, rawBody) {
        return true;
    }
};
exports.PlaidAdapter = PlaidAdapter;
exports.PlaidAdapter = PlaidAdapter = __decorate([
    (0, common_1.Injectable)()
], PlaidAdapter);
//# sourceMappingURL=plaid.adapter.js.map