"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: './tsconfig.json' }],
    },
    collectCoverageFrom: ['src/**/*.ts'],
    testEnvironment: 'node',
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map