import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    // Stub CSS and other non-JS imports
    moduleNameMapper: {
        '\\.(css|less|scss)$': '<rootDir>/src/__tests__/__mocks__/styleMock.ts',
    },
    // Use a separate tsconfig for tests (looser settings)
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.test.json',
        },
    },
};

export default config;
