"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
require("reflect-metadata");
const auth_controller_1 = require("./auth.controller");
const throttler_constants_1 = require("@nestjs/throttler/dist/throttler.constants");
(0, globals_1.describe)('AuthController throttling', () => {
    const getThrottle = (methodName, scope) => {
        const handler = auth_controller_1.AuthController.prototype[methodName];
        return {
            limit: Reflect.getMetadata(`${throttler_constants_1.THROTTLER_LIMIT}${scope}`, handler),
            ttl: Reflect.getMetadata(`${throttler_constants_1.THROTTLER_TTL}${scope}`, handler),
        };
    };
    (0, globals_1.it)('limits signup attempts', () => {
        const { limit, ttl } = getThrottle('signUp', 'signup');
        (0, globals_1.expect)(limit).toBe(5);
        (0, globals_1.expect)(ttl).toBe(300);
    });
    (0, globals_1.it)('limits signin bursts', () => {
        const { limit, ttl } = getThrottle('signIn', 'signin');
        (0, globals_1.expect)(limit).toBe(10);
        (0, globals_1.expect)(ttl).toBe(60);
    });
    (0, globals_1.it)('limits verification link submissions', () => {
        const { limit, ttl } = getThrottle('verify', 'verify');
        (0, globals_1.expect)(limit).toBe(1);
        (0, globals_1.expect)(ttl).toBe(60);
    });
    (0, globals_1.it)('limits verification resend attempts', () => {
        const { limit, ttl } = getThrottle('resend', 'verify-resend');
        (0, globals_1.expect)(limit).toBe(1);
        (0, globals_1.expect)(ttl).toBe(60);
    });
    (0, globals_1.it)('limits forgot password flow', () => {
        const { limit, ttl } = getThrottle('forgot', 'forgot');
        (0, globals_1.expect)(limit).toBe(5);
        (0, globals_1.expect)(ttl).toBe(900);
    });
    (0, globals_1.it)('limits password resets', () => {
        const { limit, ttl } = getThrottle('reset', 'reset');
        (0, globals_1.expect)(limit).toBe(5);
        (0, globals_1.expect)(ttl).toBe(300);
    });
});
//# sourceMappingURL=auth.controller.spec.js.map