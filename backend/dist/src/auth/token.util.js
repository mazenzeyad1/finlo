"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = exports.generateToken = void 0;
const crypto_1 = require("crypto");
function generateToken(bytes = 32) {
    return (0, crypto_1.randomBytes)(bytes).toString('hex');
}
exports.generateToken = generateToken;
function hashToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
exports.hashToken = hashToken;
//# sourceMappingURL=token.util.js.map