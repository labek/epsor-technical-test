module.exports = {
    collectCoverageFrom: [
        '!<rootDir>/__mocks__',
        '!<rootDir>/coverage',
        '!<rootDir>/dist',
        '!<rootDir>/node_modules/',
        '**/src/**/*.ts',
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text-summary', 'text', 'json-summary', 'json'],
    errorOnDeprecated: true,
    modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/coverage'],
    preset: '@shelf/jest-mongodb',
    testEnvironment: 'node',
    transform: { '^.+\\.ts$': 'ts-jest' },
    globals: {
        'ts-jest': {
            diagnostics: false,
            tsConfig: {
                importHelpers: true,
            },
        },
    },
};
