"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FlinksAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlinksAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FlinksAdapter = FlinksAdapter_1 = class FlinksAdapter {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(FlinksAdapter_1.name);
        this.customerId = this.config.get('FLINKS_CUSTOMER_ID', '');
        this.authKey = this.config.get('FLINKS_AUTH_KEY', '');
        this.apiKey = this.config.get('FLINKS_API_KEY', '');
        this.connectUrl = this.config.get('FLINKS_CONNECT_URL');
        if (!this.connectUrl) {
            this.logger.warn('FLINKS_CONNECT_URL is not set');
        }
    }
    async getLinkToken() {
        const token = await this.generateAuthorizeToken();
        const finalUrl = `${this.connectUrl}?demo=true&authorizeToken=${token}`;
        return { linkToken: finalUrl };
    }
    async generateAuthorizeToken() {
        const now = Date.now();
        if (this.authorizeTokenCache && this.authorizeTokenCache.expiresAt > now + 5000) {
            return this.authorizeTokenCache.token;
        }
        if (!this.customerId)
            throw new Error('Missing FLINKS_CUSTOMER_ID');
        if (!this.authKey)
            throw new Error('Missing FLINKS_AUTH_KEY');
        const url = `https://toolbox-api.private.fin.ag/v3/${this.customerId}/BankingServices/GenerateAuthorizeToken`;
        this.logger.debug(`[FlinksAdapter] Requesting token → ${url}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'flinks-auth-key': this.authKey,
            },
            body: JSON.stringify({}),
        });
        const raw = await response.text();
        this.logger.debug(`[FlinksAdapter] Response ${response.status} → ${raw}`);
        if (!response.ok) {
            throw new Error(`Authorize token failed: ${response.status} → ${raw}`);
        }
        let json;
        try {
            json = JSON.parse(raw);
        }
        catch {
            throw new Error('Failed to parse JSON from GenerateAuthorizeToken');
        }
        const token = json.Token;
        if (!token)
            throw new Error('Missing Token in Flinks response');
        const expiresIn = json.ExpiresInSeconds ?? 300;
        this.authorizeTokenCache = {
            token,
            expiresAt: now + expiresIn * 1000,
        };
        return token;
    }
    async exchangeLoginId(loginId) {
        const response = await fetch(`https://toolbox-api.private.fin.ag/v3/AccountsSummary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                LoginId: loginId,
                RequestId: `req-${Date.now()}`,
                MostRecentCached: true,
            }),
        });
        const text = await response.text();
        this.logger.debug(`AccountsSummary → ${response.status} → ${text}`);
        if (!response.ok) {
            throw new Error(`Flinks AccountsSummary failed: ${response.status}`);
        }
        const data = JSON.parse(text);
        return {
            accessToken: loginId,
            institution: {
                id: `flinks:${(data.Institution || 'Unknown')}`,
                name: data.Institution || 'Unknown',
            },
        };
    }
    async fetchAccounts(loginId) {
        const response = await fetch(`https://toolbox-api.private.fin.ag/v3/AccountsDetail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ LoginId: loginId }),
        });
        if (!response.ok)
            throw new Error('Failed to fetch accounts');
        const data = await response.json();
        if (!data.Accounts)
            return [];
        return data.Accounts.map((acc) => ({
            externalId: acc.Id,
            name: acc.Title,
            mask: acc.AccountNumber?.slice(-4),
            type: acc.Type,
            currency: acc.Currency,
            balance: acc.Balance?.Current ?? 0,
        }));
    }
    async fetchTransactions(loginId) {
        const response = await fetch(`https://toolbox-api.private.fin.ag/v3/AccountsDetail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ LoginId: loginId }),
        });
        if (!response.ok)
            throw new Error('Failed to fetch transactions');
        const data = await response.json();
        const txs = [];
        if (data.Accounts) {
            for (const acc of data.Accounts) {
                if (acc.Transactions) {
                    for (const tx of acc.Transactions) {
                        txs.push({
                            externalId: tx.Id,
                            accountExternalId: acc.Id,
                            date: tx.Date,
                            description: tx.Description,
                            amount: tx.Debit ? -tx.Debit : tx.Credit,
                            currency: acc.Currency,
                            pending: false,
                        });
                    }
                }
            }
        }
        return { transactions: txs };
    }
    verifyWebhook(_sig, _body) {
        return true;
    }
};
exports.FlinksAdapter = FlinksAdapter;
exports.FlinksAdapter = FlinksAdapter = FlinksAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FlinksAdapter);
//# sourceMappingURL=flinks.adapter.js.map