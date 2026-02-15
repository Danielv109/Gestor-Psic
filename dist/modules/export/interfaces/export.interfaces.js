"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPORT_PERMISSIONS = exports.MaskReason = exports.DataClassification = exports.ExportFormat = void 0;
const client_1 = require("@prisma/client");
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["PDF"] = "PDF";
    ExportFormat["JSON"] = "JSON";
    ExportFormat["CSV"] = "CSV";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
var DataClassification;
(function (DataClassification) {
    DataClassification["PUBLIC"] = "PUBLIC";
    DataClassification["INTERNAL"] = "INTERNAL";
    DataClassification["CONFIDENTIAL"] = "CONFIDENTIAL";
    DataClassification["RESTRICTED"] = "RESTRICTED";
})(DataClassification || (exports.DataClassification = DataClassification = {}));
var MaskReason;
(function (MaskReason) {
    MaskReason["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    MaskReason["DATA_CLASSIFICATION"] = "DATA_CLASSIFICATION";
    MaskReason["PRIVACY_PROTECTION"] = "PRIVACY_PROTECTION";
    MaskReason["REDACTED"] = "REDACTED";
})(MaskReason || (exports.MaskReason = MaskReason = {}));
exports.EXPORT_PERMISSIONS = {
    [client_1.GlobalRole.TERAPEUTA]: {
        canExportSessions: true,
        canViewNarrative: true,
        canViewPatientPII: true,
        canExportShadowNotes: true,
        canExportBulk: false,
    },
    [client_1.GlobalRole.SUPERVISOR]: {
        canExportSessions: true,
        canViewNarrative: true,
        canViewPatientPII: true,
        canExportShadowNotes: false,
        canExportBulk: true,
    },
    [client_1.GlobalRole.AUDITOR]: {
        canExportSessions: true,
        canViewNarrative: true,
        canViewPatientPII: false,
        canExportShadowNotes: false,
        canExportBulk: true,
    },
    [client_1.GlobalRole.ASISTENTE]: {
        canExportSessions: false,
        canViewNarrative: false,
        canViewPatientPII: false,
        canExportShadowNotes: false,
        canExportBulk: false,
    },
};
//# sourceMappingURL=export.interfaces.js.map