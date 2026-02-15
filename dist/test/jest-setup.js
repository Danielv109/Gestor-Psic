"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
beforeAll(() => {
    jest.spyOn(common_1.Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(common_1.Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(common_1.Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(common_1.Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(common_1.Logger.prototype, 'verbose').mockImplementation(() => undefined);
});
afterAll(() => {
    jest.restoreAllMocks();
});
//# sourceMappingURL=jest-setup.js.map