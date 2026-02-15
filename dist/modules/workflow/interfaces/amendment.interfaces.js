"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGAL_STATUS_TRANSITIONS = void 0;
const client_1 = require("@prisma/client");
exports.LEGAL_STATUS_TRANSITIONS = {
    [client_1.SessionLegalStatus.DRAFT]: [client_1.SessionLegalStatus.PENDING_REVIEW],
    [client_1.SessionLegalStatus.PENDING_REVIEW]: [client_1.SessionLegalStatus.SIGNED, client_1.SessionLegalStatus.DRAFT],
    [client_1.SessionLegalStatus.SIGNED]: [client_1.SessionLegalStatus.AMENDED, client_1.SessionLegalStatus.VOIDED],
    [client_1.SessionLegalStatus.AMENDED]: [client_1.SessionLegalStatus.VOIDED],
    [client_1.SessionLegalStatus.VOIDED]: [],
};
//# sourceMappingURL=amendment.interfaces.js.map