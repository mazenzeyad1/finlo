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
        this.baseUrl = this.config.get('FLINKS_BASE_URL', 'https://toolbox-api.private.fin.ag/v3');
        this.isSandbox = this.config.get('FLINKS_MODE', 'sandbox') === 'sandbox';
        this.customerId = this.config.get('FLINKS_CUSTOMER_ID', '');
        this.bearerToken = this.config.get('FLINKS_BEARER_TOKEN', '');
        this.authKey = this.config.get('FLINKS_AUTH_KEY', '');
        this.apiKey = this.config.get('FLINKS_API_KEY', '');
        this.connectUrl = this.config.get('FLINKS_CONNECT_URL');
        if (!this.connectUrl) {
            this.logger.warn('FLINKS_CONNECT_URL is not set – frontend will not be able to show Connect iframe');
        }
        if (this.isSandbox) {
            this.logger.log('Flinks adapter running in sandbox/toolbox mode');
        }
    }
    async getLinkToken(_userId) {
        return {
            linkToken: this.connectUrl,
            sandboxInfo: this.isSandbox ? {
                institution: 'FlinksCapital',
                username: 'Greatday',
                password: 'Everyday'
            } : undefined
        };
    }
    async exchangeLoginId(loginId) {
        try {
            const url = `${this.baseUrl}/AccountsSummary`;
            const payload = {
                LoginId: loginId,
                RequestId: `req-${Date.now()}`,
                MostRecentCached: true
            };
            this.logger.debug(`Calling Flinks API: ${url}`);
            this.logger.debug(`Flinks /AccountsSummary payload: ${JSON.stringify(payload)}`);
            const headers = {
                'Content-Type': 'application/json',
            };
            if (this.bearerToken) {
                headers['Authorization'] = `Bearer ${this.bearerToken}`;
            }
            if (this.apiKey) {
                headers['x-api-key'] = this.apiKey;
            }
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            const text = await response.text();
            this.logger.debug(`Flinks /AccountsSummary status=${response.status} body=${text}`);
            if (!response.ok) {
                throw new Error(`Flinks API error: ${response.status}`);
            }
            const data = JSON.parse(text || '{}');
            const institutionName = data.Institution || 'Unknown Institution';
            const institutionId = `flinks:${institutionName.toLowerCase().replace(/\s+/g, '-')}`;
            return {
                accessToken: loginId,
                institution: {
                    id: institutionId,
                    name: institutionName
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to exchange Flinks login', error);
            throw error;
        }
    }
    async fetchAccounts(loginId) {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (this.bearerToken) {
                headers['Authorization'] = `Bearer ${this.bearerToken}`;
            }
            if (this.apiKey) {
                headers['x-api-key'] = this.apiKey;
            }
            const response = await fetch(`${this.baseUrl}/AccountsDetail`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    LoginId: loginId,
                    RequestId: `req-${Date.now()}`
                })
            });
            if (!response.ok) {
                throw new Error(`Flinks API error: ${response.status}`);
            }
            const data = await response.json();
            if (!data.Accounts || data.Accounts.length === 0) {
                return [];
            }
            return data.Accounts.map(account => ({
                externalId: account.Id,
                name: account.Title || 'Unnamed Account',
                mask: account.AccountNumber?.slice(-4),
                type: this.mapAccountType(account.Type),
                currency: account.Currency || 'CAD',
                balance: account.Balance?.Current || 0
            }));
        }
        catch (error) {
            this.logger.error('Failed to fetch Flinks accounts', error);
            throw error;
        }
    }
    async fetchTransactions(loginId, opts) {
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (this.bearerToken) {
                headers['Authorization'] = `Bearer ${this.bearerToken}`;
            }
            if (this.apiKey) {
                headers['x-api-key'] = this.apiKey;
            }
            const response = await fetch(`${this.baseUrl}/AccountsDetail`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    LoginId: loginId,
                    RequestId: `req-${Date.now()}`,
                    MostRecentCached: opts.cursor !== undefined
                })
            });
            if (!response.ok) {
                throw new Error(`Flinks API error: ${response.status}`);
            }
            const data = await response.json();
            const transactions = [];
            if (data.Accounts) {
                for (const account of data.Accounts) {
                    if (account.Transactions) {
                        for (const tx of account.Transactions) {
                            transactions.push({
                                externalId: tx.Id || `tx-${Date.now()}-${Math.random()}`,
                                accountExternalId: account.Id,
                                date: tx.Date || new Date().toISOString(),
                                description: tx.Description || 'Unknown',
                                amount: tx.Debit ? -Math.abs(tx.Debit) : (tx.Credit || 0),
                                currency: account.Currency || 'CAD',
                                pending: false
                            });
                        }
                    }
                }
            }
            return {
                transactions,
                nextCursor: data.RequestId
            };
        }
        catch (error) {
            this.logger.error('Failed to fetch Flinks transactions', error);
            throw error;
        }
    }
    verifyWebhook(_sigHeader, _rawBody) {
        return this.isSandbox ? true : false;
    }
    mapAccountType(flinksType) {
        const normalized = (flinksType || '').toLowerCase();
        if (normalized.includes('checking') || normalized.includes('chequing'))
            return 'checking';
        if (normalized.includes('saving'))
            return 'savings';
        if (normalized.includes('credit'))
            return 'credit';
        if (normalized.includes('loan') || normalized.includes('mortgage'))
            return 'loan';
        if (normalized.includes('investment') || normalized.includes('rrsp') || normalized.includes('tfsa'))
            return 'investment';
        return 'checking';
    }
    async generateAuthorizeToken() {
        const now = Date.now();
        if (this.authorizeTokenCache && this.authorizeTokenCache.expiresAt > now + 5000) {
            return this.authorizeTokenCache.token;
        }
        if (!this.authKey && !this.bearerToken) {
            throw new Error('FLINKS_AUTH_KEY or FLINKS_BEARER_TOKEN must be configured');
        }
        const baseApiUrl = this.baseUrl.replace(/\/v3\/?$/, '');
        const url = `${baseApiUrl}/v3/GenerateAuthorizeToken`;
        this.logger.debug(`Requesting Flinks authorize token via ${url}`);
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.authKey) {
            headers['Authorization'] = `Bearer ${this.authKey}`;
        }
        else if (this.bearerToken) {
            headers['Authorization'] = `Bearer ${this.bearerToken}`;
        }
        if (this.apiKey) {
            headers['x-api-key'] = this.apiKey;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
        });
        const text = await response.text();
        this.logger.debug(`Flinks /GenerateAuthorizeToken status=${response.status} body=${text}`);
        if (!response.ok) {
            throw new Error(`Flinks authorize token request failed with status ${response.status}: ${text}`);
        }
        const data = JSON.parse(text || '{}');
        if (!data.AuthorizeToken) {
            throw new Error('Flinks authorize token response missing AuthorizeToken field');
        }
        const expiresInSeconds = data.ExpiresInSeconds ?? 300;
        this.authorizeTokenCache = {
            token: data.AuthorizeToken,
            expiresAt: now + expiresInSeconds * 1000,
        };
        this.logger.log(`Generated Flinks authorize token (expires in ${expiresInSeconds}s)`);
        return data.AuthorizeToken;
    }
};
exports.FlinksAdapter = FlinksAdapter;
exports.FlinksAdapter = FlinksAdapter = FlinksAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FlinksAdapter);
//# sourceMappingURL=flinks.adapter.js.map