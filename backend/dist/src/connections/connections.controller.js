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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsController = void 0;
const common_1 = require("@nestjs/common");
const connections_service_1 = require("./connections.service");
let ConnectionsController = class ConnectionsController {
    constructor(svc) {
        this.svc = svc;
    }
    start(body) {
        return this.svc.startLink(body.userId);
    }
    exchange(body) {
        console.log('[ConnectionsController] exchange loginId =', body?.loginId);
        return this.svc.exchangeLoginId(body.userId, body.loginId);
    }
    list(userId) {
        return this.svc['prisma'].connection.findMany({ where: { userId } });
    }
    async sync(connectionId, userId) {
        const connection = await this.svc['prisma'].connection.findFirst({
            where: { id: connectionId, userId },
        });
        if (!connection) {
            throw new Error('Connection not found');
        }
        return this.svc.syncConnection(connectionId);
    }
};
exports.ConnectionsController = ConnectionsController;
__decorate([
    (0, common_1.Post)('link/start'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('link/exchange'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "exchange", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':id/sync'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "sync", null);
exports.ConnectionsController = ConnectionsController = __decorate([
    (0, common_1.Controller)('connections'),
    __metadata("design:paramtypes", [connections_service_1.ConnectionsService])
], ConnectionsController);
//# sourceMappingURL=connections.controller.js.map