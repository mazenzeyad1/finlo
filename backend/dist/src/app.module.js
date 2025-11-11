"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const institutions_module_1 = require("./institutions/institutions.module");
const connections_module_1 = require("./connections/connections.module");
const accounts_module_1 = require("./accounts/accounts.module");
const transactions_module_1 = require("./transactions/transactions.module");
const budgets_module_1 = require("./budgets/budgets.module");
const rules_module_1 = require("./rules/rules.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const providers_module_1 = require("./providers/providers.module");
const observability_module_1 = require("./observability/observability.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60,
                    limit: 60,
                },
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            institutions_module_1.InstitutionsModule,
            connections_module_1.ConnectionsModule,
            accounts_module_1.AccountsModule,
            transactions_module_1.TransactionsModule,
            budgets_module_1.BudgetsModule,
            rules_module_1.RulesModule,
            webhooks_module_1.WebhooksModule,
            providers_module_1.ProvidersModule,
            observability_module_1.ObservabilityModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map