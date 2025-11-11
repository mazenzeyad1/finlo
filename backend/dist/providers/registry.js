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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
const plaid_adapter_1 = require("./plaid/plaid.adapter");
const flinks_adapter_1 = require("./flinks/flinks.adapter");
let ProviderRegistry = class ProviderRegistry {
    constructor(plaid, flinks) {
        this.plaid = plaid;
        this.flinks = flinks;
    }
    byProvider(provider) {
        return provider === 'plaid' ? this.plaid : this.flinks;
    }
};
exports.ProviderRegistry = ProviderRegistry;
exports.ProviderRegistry = ProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [plaid_adapter_1.PlaidAdapter, flinks_adapter_1.FlinksAdapter])
], ProviderRegistry);
//# sourceMappingURL=registry.js.map