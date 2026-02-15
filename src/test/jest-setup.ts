// src/test/jest-setup.ts
/**
 * Jest Setup File
 * 
 * This file is executed before each test file.
 * It silences NestJS Logger output during tests to keep console clean.
 */
import { Logger } from '@nestjs/common';

// Silence all NestJS logger output during tests
beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);
});

afterAll(() => {
    jest.restoreAllMocks();
});
