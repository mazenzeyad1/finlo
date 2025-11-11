"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersModule = void 0;
const common_1 = require("@nestjs/common");
const plaid_adapter_1 = require("./plaid/plaid.adapter");
const flinks_adapter_1 = require("./flinks/flinks.adapter");
const registry_1 = require("./registry");
let ProvidersModule = class ProvidersModule {
};
exports.ProvidersModule = ProvidersModule;
exports.ProvidersModule = ProvidersModule = __decorate([
    (0, common_1.Module)({
        providers: [plaid_adapter_1.PlaidAdapter, flinks_adapter_1.FlinksAdapter, registry_1.ProviderRegistry],
        exports: [registry_1.ProviderRegistry, plaid_adapter_1.PlaidAdapter, flinks_adapter_1.FlinksAdapter],
    })
], ProvidersModule);
//# sourceMappingURL=providers.module.js.map